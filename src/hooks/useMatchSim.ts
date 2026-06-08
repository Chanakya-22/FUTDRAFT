import { useCallback, useEffect, useRef, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Player } from '../types';
import { calculateTeamOVR, MatchStats, generateOpponent, evaluateLiveMinute } from '../engine/MatchMath';
import { supabase } from '../api/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Mentality = 'attack' | 'balanced' | 'defense';

interface MatchScore {
  user: number;
  cpu: number;
}

type MatchPhase = 'live' | 'halftime' | 'fulltime' | 'penalties';

type PenaltyTurn = 'user_shoot' | 'user_save' | null;
type PenaltyOutcome = 'goal' | 'miss' | 'pending';

interface UseMatchSimResult {
  clock: number;
  score: MatchScore;
  events: string[];
  mentality: Mentality;
  isPaused: boolean;
  isHalfTime: boolean;
  matchPhase: MatchPhase;
  activePitch: Player[];
  activeBench: Player[];
  cpuTeam: Player[];
  cpuLoading: boolean;
  subsRemaining: number;
  subModalOpen: boolean;
  penaltyTurn: PenaltyTurn;
  penaltyRound: number;
  penaltyShootout: { user: number; cpu: number };
  userPenaltyLog: PenaltyOutcome[];
  cpuPenaltyLog: PenaltyOutcome[];
  coinsEarned: number;
  matchResult: 'WIN' | 'DRAW' | 'LOSS' | null;
  setMentality: (mentality: Mentality) => void;
  togglePause: () => void;
  openSubModal: () => void;
  closeSubModal: () => void;
  performSub: (pitchPlayerId: number, benchPlayerId: number) => boolean;
  resumeSecondHalf: () => void;
  shootPenalty: (direction: 'LEFT' | 'MIDDLE' | 'RIGHT') => void;
  resetMatch: () => void;
  pauseMatch: () => void;
}

const MATCH_LENGTH = 90;
const MAX_SUBS = 4;
const TICK_MS = 1000;

const shufflePlayers = <T,>(items: T[]): T[] => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export const useMatchSim = (startingXI: Player[], bench: Player[]): UseMatchSimResult => {
  const authContext = useContext(AuthContext);
  const user = authContext?.session?.user;

  const [clock, setClock] = useState(0);
  const [score, setScore] = useState<MatchScore>({ user: 0, cpu: 0 });
  const [events, setEvents] = useState<string[]>([]);
  const [mentality, setMentality] = useState<Mentality>('balanced');
  const [isPaused, setIsPaused] = useState(true);
  const [isHalfTime, setIsHalfTime] = useState(false);
  const [matchPhase, setMatchPhase] = useState<MatchPhase>('live');
  const [activePitch, setActivePitch] = useState<Player[]>(() => [...startingXI]);
  const [activeBench, setActiveBench] = useState<Player[]>(() => [...bench]);
  const [yellowCards, setYellowCards] = useState<Record<number, number>>({});
  const [cpuTeam, setCpuTeam] = useState<Player[]>([]);
  const [cpuLoading, setCpuLoading] = useState(true);
  const [subsRemaining, setSubsRemaining] = useState(MAX_SUBS);
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [penaltyTurn, setPenaltyTurn] = useState<PenaltyTurn>(null);
  const [penaltyRound, setPenaltyRound] = useState(0);
  const [penaltyShootout, setPenaltyShootout] = useState({ user: 0, cpu: 0 });
  const [userPenaltyLog, setUserPenaltyLog] = useState<PenaltyOutcome[]>(
    Array(5).fill('pending'),
  );
  const [cpuPenaltyLog, setCpuPenaltyLog] = useState<PenaltyOutcome[]>(
    Array(5).fill('pending'),
  );
  
  // Game Economy State variables
  const [coinsEarned, setCoinsEarned] = useState<number>(0);
  const [matchResult, setMatchResult] = useState<'WIN' | 'DRAW' | 'LOSS' | null>(null);

  // Platform agnostic reference for React Native timers
  const intervalRef = useRef<any>(null);
  const preSimRef = useRef<any>(null);
  const oppNameRef = useRef<string>('Opponent');
  const hasRewarded = useRef(false);

  useEffect(() => {
    if (activePitch.length === 0 && startingXI.length > 0) {
      setActivePitch([...startingXI]);
    }
    if (activeBench.length === 0 && bench.length > 0) {
      setActiveBench([...bench]);
    }
  }, [startingXI, bench, activePitch.length, activeBench.length]);

  const fetchCpuTeam = useCallback(async () => {
    setCpuLoading(true);
    const userOVR = Math.max(65, Math.min(90, calculateTeamOVR(startingXI) || 76));

    const { data, error } = await supabase.from('players').select('*').limit(200);

    if (error || !data) {
      setEvents((existing) => [
        ...existing,
        'Unable to load CPU squad from Supabase. Check connection.',
      ]);
      setCpuTeam([]);
      setCpuLoading(false);
      return;
    }

    const shuffled = shufflePlayers(data);
    const targetMin = Math.max(65, userOVR - 4);
    const targetMax = Math.min(88, userOVR + 4);
    const filtered = shuffled.filter((player) => {
      const rating = typeof player.rating === 'number' ? player.rating : Number(player.rating) || 0;
      return rating >= targetMin && rating <= targetMax;
    });

    const selected = filtered.length >= 11 ? shufflePlayers(filtered).slice(0, 11) : shuffled.slice(0, 11);
    setCpuTeam(selected);

    const oppProfile = generateOpponent();
    oppNameRef.current = oppProfile.name || 'Opponent';

    setEvents([`Kickoff! Match against ${oppProfile.name} begins.`]);
    setCpuLoading(false);
    setIsPaused(false);
  }, [startingXI]);

  const resetMatch = useCallback(() => {
    setClock(0);
    setScore({ user: 0, cpu: 0 });
    setEvents([]);
    setMentality('balanced');
    setIsPaused(true);
    setIsHalfTime(false);
    setMatchPhase('live');
    setActivePitch([...startingXI]);
    setActiveBench([...bench]);
    setSubsRemaining(MAX_SUBS);
    setSubModalOpen(false);
    setPenaltyTurn(null);
    setPenaltyRound(0);
    setPenaltyShootout({ user: 0, cpu: 0 });
    setUserPenaltyLog(Array(5).fill('pending'));
    setCpuPenaltyLog(Array(5).fill('pending'));
    setCoinsEarned(0);
    setMatchResult(null);
    hasRewarded.current = false;
    preSimRef.current = null;
    
    // Regenerate a brand new team on reset for ultimate replayability
    fetchCpuTeam();
  }, [bench, startingXI, fetchCpuTeam]);

  useEffect(() => {
    fetchCpuTeam();
  }, [fetchCpuTeam]);

  // Secure Coin Rewards Ledger updates
  useEffect(() => {
    if (matchPhase === 'fulltime' && user && !hasRewarded.current) {
      hasRewarded.current = true;

      const finalizeMatchAndReward = async () => {
        let finalResult: 'WIN' | 'DRAW' | 'LOSS' = 'DRAW';
        let finalCoins = 200;

        // Determine outcome based on 90 minutes or Interactive Penalty Shootout
        if (score.user > score.cpu) {
          finalResult = 'WIN';
          finalCoins = 500;
        } else if (score.cpu > score.user) {
          finalResult = 'LOSS';
          finalCoins = 100;
        } else {
          // Normal time was a draw, evaluate the interactive penalty marks
          if (penaltyShootout.user > penaltyShootout.cpu) {
            finalResult = 'WIN';
            finalCoins = 500;
          } else if (penaltyShootout.cpu > penaltyShootout.user) {
            finalResult = 'LOSS';
            finalCoins = 100;
          }
        }

        setCoinsEarned(finalCoins);
        setMatchResult(finalResult);

        setEvents((existing) => [
          ...existing,
          `💰 Match Rewards: ${finalCoins} Coins Earned!`,
        ]);

        try {
          // Instead of querying and updating, we simply call the server-side function
          const { error: rpcError } = await supabase
            .rpc('add_match_coins', { amount: finalCoins });

          if (rpcError) throw rpcError;
          
          console.log('Coins successfully deposited via RPC!');
        } catch (err) {
          console.error('Failed to reward coins:', err);
        }
      };

      finalizeMatchAndReward();
    }
  }, [matchPhase, user, score, penaltyShootout]);

  // Minute-by-Minute Live Simulation Ticker
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (matchPhase === 'penalties' || isPaused || cpuLoading || cpuTeam.length < 11) {
      return;
    }

    intervalRef.current = setInterval(() => {
      setClock((currentClock) => {
        if (currentClock >= MATCH_LENGTH) return currentClock;

        const nextClock = currentClock + 1;

        if (nextClock === 45) {
          setIsPaused(true);
          setIsHalfTime(true);
          setEvents((existing) => [...existing, "⏸ HALFTIME"]);
          return nextClock;
        }

        if (nextClock >= MATCH_LENGTH) {
          setIsPaused(true);
          if (score.user === score.cpu) {
            setMatchPhase('penalties');
            setPenaltyTurn('user_shoot');
            setPenaltyRound(1);
            setEvents((existing) => [...existing, '⚫ PENALTY SHOOTOUT BEGINS']);
          } else {
            setMatchPhase('fulltime');
            setEvents((existing) => [...existing, '🏁 FULL TIME']);
          }
          return nextClock;
        }

        const event = evaluateLiveMinute(
          calculateTeamOVR(activePitch),
          calculateTeamOVR(cpuTeam),
          activePitch,
          cpuTeam,
          mentality,
          oppNameRef.current,
          nextClock,
          score.user - score.cpu,
        );

        if (event.type === 'goal') {
          setScore((s) => ({
            user: event.team === 'user' ? s.user + 1 : s.user,
            cpu: event.team === 'cpu' ? s.cpu + 1 : s.cpu,
          }));
          setEvents((existing) => [...existing, `${nextClock}' - ${event.text}`]);
        } else if (event.type === 'yellow') {
          const currentYellows = (yellowCards[event.playerId!] || 0) + 1;

          if (currentYellows >= 2) {
            setEvents((existing) => [
              ...existing,
              `${nextClock}' - 🟥 RED CARD! ${event.playerName} is sent off!`,
            ]);

            if (event.team === 'user') {
              setActivePitch((players) =>
                players.filter((player) => player.id !== event.playerId),
              );
            }

            if (event.team === 'cpu') {
              setCpuTeam((players) =>
                players.filter((player) => player.id !== event.playerId),
              );
            }
          } else {
            setYellowCards((cards) => ({
              ...cards,
              [event.playerId!]: currentYellows,
            }));
            setEvents((existing) => [...existing, `${nextClock}' - ${event.text}`]);
          }
        } else if (event.type !== 'none') {
          setEvents((existing) => [...existing, `${nextClock}' - ${event.text}`]);
        }

        return nextClock;
      });
    }, TICK_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activePitch, cpuLoading, cpuTeam, isPaused, matchPhase, mentality, yellowCards, score]);

  // --- UPDATED DEEP PERSISTENCE ENGINE ---
  useEffect(() => {
    const saveProgress = async () => {
      if (clock === 0 || matchPhase === 'fulltime') return;
      try {
        const gameState = { 
          clock, 
          score, 
          matchPhase,
          mentality,
          subsRemaining,
          events,
          yellowCards,
          activePitch,
          activeBench
        };
        await AsyncStorage.setItem('match_save', JSON.stringify(gameState));
      } catch (err) {
        console.error('Failed to save match progress', err);
      }
    };
    saveProgress();
  }, [clock, score, matchPhase, mentality, subsRemaining, events, yellowCards, activePitch, activeBench]);

  // --- CLEANUP LOCAL STORAGE CACHE UPON CONCLUSION ---
  useEffect(() => {
    if (matchPhase === 'fulltime' || clock === 0) {
      AsyncStorage.removeItem('match_save').catch((err) =>
        console.error('Failed to clear match save', err)
      );
    }
  }, [matchPhase, clock]);

  const performSub = useCallback(
    (pitchPlayerId: number, benchPlayerId: number) => {
      if (subsRemaining <= 0) {
        return false;
      }

      const pitchIndex = activePitch.findIndex((player) => player.id === pitchPlayerId);
      const benchIndex = activeBench.findIndex((player) => player.id === benchPlayerId);
      if (pitchIndex === -1 || benchIndex === -1) {
        return false;
      }

      const nextPitch = [...activePitch];
      const nextBench = [...activeBench];
      const pitchPlayer = nextPitch[pitchIndex];
      nextPitch[pitchIndex] = nextBench[benchIndex];
      nextBench[benchIndex] = pitchPlayer;

      setActivePitch(nextPitch);
      setActiveBench(nextBench);
      setSubsRemaining((current) => current - 1);
      
      const outName = pitchPlayer?.name || (pitchPlayer as any)?.player_data?.name || 'Player';
      const inName = nextPitch[pitchIndex]?.name || (nextPitch[pitchIndex] as any)?.player_data?.name || 'Player';

      setEvents((existing) => [
        ...existing,
        `SUB: ${outName} → ${inName}`,
      ]);
      return true;
    },
    [activeBench, activePitch, subsRemaining],
  );

  const togglePause = useCallback(() => {
    setIsPaused((current) => !current);
  }, []);

  const pauseMatch = useCallback(() => {
    setIsPaused(true);
  }, []);

  const openSubModal = useCallback(() => {
    setIsPaused(true);
    setSubModalOpen(true);
  }, []);

  const closeSubModal = useCallback(() => {
    setSubModalOpen(false);
    setIsPaused(false);
  }, []);

  const resumeSecondHalf = useCallback(() => {
    setIsHalfTime(false);
    setIsPaused(false);
  }, []);

  const shootPenalty = useCallback(
    (direction: 'LEFT' | 'MIDDLE' | 'RIGHT') => {
      if (!penaltyTurn) {
        return;
      }

      const directions = ['LEFT', 'MIDDLE', 'RIGHT'] as const;
      const currentRoundIndex = Math.max(0, Math.min(4, penaltyRound - 1));

      if (penaltyTurn === 'user_shoot') {
        const cpuDive = directions[Math.floor(Math.random() * 3)];
        const scored = direction !== cpuDive;
        setUserPenaltyLog((current) =>
          current.map((value, index) =>
            index === currentRoundIndex ? (scored ? 'goal' : 'miss') : value,
          ),
        );
        setPenaltyShootout((previous) => ({
          user: scored ? previous.user + 1 : previous.user,
          cpu: previous.cpu,
        }));
        setEvents((existing) => [
          ...existing,
          `Round ${penaltyRound} • User shoots ${direction} → CPU dives ${cpuDive} → ${
            scored ? 'GOAL' : 'SAVED'
          }`,
        ]);
        setPenaltyTurn('user_save');
        return;
      }

      const cpuTarget = directions[Math.floor(Math.random() * 3)];
      const saved = direction === cpuTarget;
      setCpuPenaltyLog((current) =>
        current.map((value, index) =>
          index === currentRoundIndex ? (saved ? 'miss' : 'goal') : value,
        ),
      );
      setPenaltyShootout((previous) => ({
        user: previous.user,
        cpu: saved ? previous.cpu : previous.cpu + 1,
      }));
      setEvents((existing) => [
        ...existing,
        `Round ${penaltyRound} • CPU shoots ${cpuTarget} → User dives ${direction} → ${
          saved ? 'SAVED' : 'GOAL'
        }`,
      ]);

      const isFinalRound = penaltyRound >= 5;
      const nextPenaltyRound = penaltyRound + 1;
      const currentUserScore = penaltyShootout.user;
      const currentCpuScore = saved ? penaltyShootout.cpu : penaltyShootout.cpu + 1;

      if (isFinalRound && currentUserScore !== currentCpuScore) {
        setPenaltyTurn(null);
        setMatchPhase('fulltime');
        const winner = currentUserScore > currentCpuScore ? 'USER' : 'CPU';
        setEvents((existing) => [...existing, `🏆 Penalty Shootout: ${winner} WINS`]);
        setPenaltyRound(nextPenaltyRound);
        return;
      }

      if (isFinalRound && currentUserScore === currentCpuScore && penaltyRound === 5) {
        setEvents((existing) => [...existing, '🔄 SUDDEN DEATH']);
      }

      setPenaltyRound(nextPenaltyRound);
      setPenaltyTurn('user_shoot');
    },
    [penaltyRound, penaltyShootout, penaltyTurn],
  );

  return {
    clock,
    score,
    events,
    mentality,
    isPaused,
    isHalfTime,
    matchPhase,
    activePitch,
    activeBench,
    cpuTeam,
    cpuLoading,
    subsRemaining,
    subModalOpen,
    penaltyTurn,
    penaltyRound,
    penaltyShootout,
    userPenaltyLog,
    cpuPenaltyLog,
    coinsEarned,
    matchResult,
    setMentality,
    togglePause,
    openSubModal,
    closeSubModal,
    performSub,
    resumeSecondHalf,
    shootPenalty,
    resetMatch,
    pauseMatch,
  };
};