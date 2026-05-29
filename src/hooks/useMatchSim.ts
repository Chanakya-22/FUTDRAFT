import { useCallback, useEffect, useRef, useState } from 'react';
import { Player } from '../types';
import { evaluateEncounter, generateCPUTeam, MatchEvent, Mentality } from '../engine/MatchMath';

interface MatchScore {
  user: number;
  cpu: number;
}

type MatchPhase = 'live' | 'halftime' | 'fulltime' | 'penalties';

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
  subsRemaining: number;
  subModalOpen: boolean;
  penaltyPhase: 'shooting' | 'selecting' | null;
  penaltyRound: number;
  penaltyShootout: { user: number; cpu: number };
  setMentality: (mentality: Mentality) => void;
  togglePause: () => void;
  openSubModal: () => void;
  closeSubModal: () => void;
  performSub: (pitchPlayerId: number, benchPlayerId: number) => boolean;
  resumeSecondHalf: () => void;
  shootPenalty: (direction: 'LEFT' | 'MIDDLE' | 'RIGHT') => void;
  resetMatch: () => void;
}

const MATCH_LENGTH = 90;
const MAX_SUBS = 4;
const TICK_MS = 1000;
const ENCOUNTER_CHANCE = 0.2;

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
  const [cpuTeam] = useState<Player[]>(() => generateCPUTeam());
  const [subsRemaining, setSubsRemaining] = useState(MAX_SUBS);
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [penaltyPhase, setPenaltyPhase] = useState<'shooting' | 'selecting' | null>(null);
  const [penaltyRound, setPenaltyRound] = useState(0);
  const [penaltyShootout, setPenaltyShootout] = useState({ user: 0, cpu: 0 });
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
    setPenaltyPhase(null);
    setPenaltyRound(0);
    setPenaltyShootout({ user: 0, cpu: 0 });
  }, [bench, startingXI]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (matchPhase === 'penalties') {
      return () => {};
    }

    intervalRef.current = setInterval(() => {
      setClock((currentClock) => {
        if (isPaused || currentClock >= MATCH_LENGTH) {
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
            setPenaltyPhase('shooting');
            setPenaltyRound(1);
            setEvents((existing) => [...existing, "⚫ PENALTY SHOOTOUT BEGINS"]);
          } else {
            setMatchPhase('fulltime');
            setEvents((existing) => [...existing, "🏁 FULL TIME"]);
          }
          return nextClock;
        }

        if (Math.random() < ENCOUNTER_CHANCE) {
          const encounter = evaluateEncounter(mentality, activePitch, cpuTeam);
          if (encounter.type !== 'neutral') {
            setEvents((existing) => [...existing, `${nextClock}' ${encounter.message}`]);

            if (encounter.type === 'goal') {
              setScore((previous) => ({
                user: encounter.team === 'user' ? previous.user + 1 : previous.user,
                cpu: encounter.team === 'cpu' ? previous.cpu + 1 : previous.cpu,
              }));
            }
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
  }, [activePitch, cpuTeam, isPaused, matchPhase, mentality, score]);

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
      setEvents((existing) => [
        ...existing,
        `SUB: ${pitchPlayer.name} → ${nextPitch[pitchIndex].name}`,
      ]);
      return true;
    },
    [activeBench, activePitch, subsRemaining],
  );

  const togglePause = useCallback(() => {
    setIsPaused((current) => !current);
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
    (userDirection: 'LEFT' | 'MIDDLE' | 'RIGHT') => {
      const directions = ['LEFT', 'MIDDLE', 'RIGHT'] as const;
      const cpuDirection = directions[Math.floor(Math.random() * 3)];
      const isGoal = userDirection !== cpuDirection;

      setPenaltyShootout((prev) => ({
        user: isGoal ? prev.user + 1 : prev.user,
        cpu: prev.cpu,
      }));

      const result = isGoal ? 'GOAL' : 'SAVED';
      setEvents((existing) => [
        ...existing,
        `Round ${penaltyRound}: User shoots ${userDirection} → CPU dives ${cpuDirection} → ${result}`,
      ]);

      if (penaltyRound >= 5) {
        if (penaltyShootout.user !== penaltyShootout.cpu) {
          setPenaltyPhase(null);
          setMatchPhase('fulltime');
          const winner = penaltyShootout.user > penaltyShootout.cpu ? 'USER' : 'CPU';
          setEvents((existing) => [...existing, `🏆 Penalty Shootout: ${winner} WINS`]);
        } else {
          setEvents((existing) => [...existing, "🔄 SUDDEN DEATH"]);
          setPenaltyRound((r) => r + 1);
        }
      } else {
        setPenaltyRound((r) => r + 1);
      }
    },
    [penaltyRound, penaltyShootout],
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
    subsRemaining,
    subModalOpen,
    penaltyPhase,
    penaltyRound,
    penaltyShootout,
    setMentality,
    togglePause,
    openSubModal,
    closeSubModal,
    performSub,
    resumeSecondHalf,
    shootPenalty,
    resetMatch,
  };
};
