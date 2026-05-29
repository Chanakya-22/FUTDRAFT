import { useCallback, useEffect, useRef, useState } from 'react';
import { Player } from '../types';
import { evaluateEncounter, generateCPUTeam, MatchEvent, Mentality } from '../engine/MatchMath';

interface MatchScore {
  user: number;
  cpu: number;
}

interface UseMatchSimResult {
  clock: number;
  score: MatchScore;
  events: string[];
  mentality: Mentality;
  subsRemaining: number;
  isPaused: boolean;
  activePitch: Player[];
  activeBench: Player[];
  cpuTeam: Player[];
  subModalOpen: boolean;
  setMentality: (mentality: Mentality) => void;
  togglePause: () => void;
  openSubModal: () => void;
  closeSubModal: () => void;
  performSub: (pitchPlayerId: number, benchPlayerId: number) => boolean;
  resetMatch: () => void;
}

const MATCH_LENGTH = 90;
const MAX_SUBS = 4;
const TICK_MS = 200;

export const useMatchSim = (startingXI: Player[], bench: Player[]): UseMatchSimResult => {
  const [clock, setClock] = useState(0);
  const [score, setScore] = useState<MatchScore>({ user: 0, cpu: 0 });
  const [events, setEvents] = useState<string[]>([]);
  const [mentality, setMentality] = useState<Mentality>('balanced');
  const [subsRemaining, setSubsRemaining] = useState(MAX_SUBS);
  const [isPaused, setIsPaused] = useState(true);
  const [activePitch, setActivePitch] = useState<Player[]>(() => [...startingXI]);
  const [activeBench, setActiveBench] = useState<Player[]>(() => [...bench]);
  const [cpuTeam] = useState<Player[]>(() => generateCPUTeam());
  const [subModalOpen, setSubModalOpen] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const resetMatch = useCallback(() => {
    setClock(0);
    setScore({ user: 0, cpu: 0 });
    setEvents([]);
    setMentality('balanced');
    setSubsRemaining(MAX_SUBS);
    setIsPaused(true);
    setActivePitch([...startingXI]);
    setActiveBench([...bench]);
    setSubModalOpen(false);
  }, [bench, startingXI]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setClock((currentClock) => {
        if (isPaused || currentClock >= MATCH_LENGTH) {
          return currentClock;
        }

        const nextClock = currentClock + 1;
        const encounter = evaluateEncounter(mentality, activePitch, cpuTeam);

        if (encounter.type !== 'neutral') {
          setEvents((existing) => [
            ...existing,
            `${nextClock}' ${encounter.text}`,
          ]);
        }

        if (encounter.type === 'goal') {
          setScore((previous) => ({
            user: encounter.team === 'user' ? previous.user + 1 : previous.user,
            cpu: encounter.team === 'cpu' ? previous.cpu + 1 : previous.cpu,
          }));
        }

        return nextClock;
      });
    }, TICK_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [activePitch, cpuTeam, isPaused, mentality]);

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
        `Substitution: ${pitchPlayer.name} replaced by ${nextPitch[pitchIndex].name}.`,
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

  return {
    clock,
    score,
    events,
    mentality,
    subsRemaining,
    isPaused,
    activePitch,
    activeBench,
    cpuTeam,
    subModalOpen,
    setMentality,
    togglePause,
    openSubModal,
    closeSubModal,
    performSub,
    resetMatch,
  };
};
