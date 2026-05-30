import { useCallback, useEffect, useRef, useState } from 'react';
import { Player } from '../types';
import { evaluateEncounter, Mentality } from '../engine/MatchMath';
import { supabase } from '../api/supabaseClient';

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
const ENCOUNTER_CHANCE = 0.45;

const shufflePlayers = <T,>(items: T[]): T[] => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export const useMatchSim = (startingXI: Player[], bench: Player[]): UseMatchSimResult => {
  const [clock, setClock] = useState(0);
  const [score, setScore] = useState<MatchScore>({ user: 0, cpu: 0 });
  const [events, setEvents] = useState<string[]>([]);
  const [mentality, setMentality] = useState<Mentality>('balanced');
  const [isPaused, setIsPaused] = useState(true);
  const [isHalfTime, setIsHalfTime] = useState(false);
  const [matchPhase, setMatchPhase] = useState<MatchPhase>('live');
  const [activePitch, setActivePitch] = useState<Player[]>(() => [...startingXI]);
  const [activeBench, setActiveBench] = useState<Player[]>(() => [...bench]);
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
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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
  }, [bench, startingXI]);

  const fetchCpuTeam = useCallback(async () => {
    setCpuLoading(true);
    const { data, error } = await supabase
      .from<Player>('players')
      .select('*')
      .gte('rating', 80)
      .order('rating', { ascending: false })
      .limit(200);

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
    const selected = shuffled.slice(0, 11);
    setCpuTeam(selected);
    setCpuLoading(false);
    setIsPaused(false);
  }, []);

  useEffect(() => {
    fetchCpuTeam();
  }, [fetchCpuTeam]);

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
        if (currentClock >= MATCH_LENGTH) {
          return currentClock;
        }

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

        if (Math.random() < ENCOUNTER_CHANCE) {
          const encounter = evaluateEncounter(mentality, activePitch, cpuTeam);
          setEvents((existing) => [...existing, `${nextClock}' ${encounter.message}`]);

          if (encounter.type === 'goal') {
            setScore((previous) => ({
              user: encounter.team === 'user' ? previous.user + 1 : previous.user,
              cpu: encounter.team === 'cpu' ? previous.cpu + 1 : previous.cpu,
            }));
          }
        }

        return nextClock;
      });
    }, TICK_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [activePitch, cpuLoading, cpuTeam, isPaused, matchPhase, mentality, score]);

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
