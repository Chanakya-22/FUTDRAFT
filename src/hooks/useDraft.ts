import { useCallback, useMemo, useState } from 'react';
import { supabase } from '../api/supabaseClient';
import { Player } from '../types';

export type DraftStatus = 'idle' | 'drafting' | 'finished';

const SLOT_POSITION_MAP: ReadonlyArray<readonly string[]> = [
  ['GK'],
  ['LB', 'RB', 'CB', 'LWB', 'RWB'],
  ['LB', 'RB', 'CB', 'LWB', 'RWB'],
  ['LB', 'RB', 'CB', 'LWB', 'RWB'],
  ['LB', 'RB', 'CB', 'LWB', 'RWB'],
  ['CM', 'CAM', 'CDM', 'LM', 'RM'],
  ['CM', 'CAM', 'CDM', 'LM', 'RM'],
  ['CM', 'CAM', 'CDM', 'LM', 'RM'],
  ['LW', 'RW', 'ST', 'CF'],
  ['LW', 'RW', 'ST', 'CF'],
  ['LW', 'RW', 'ST', 'CF'],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
];

const CHOICE_COUNT = 5;
const STARTING_COUNT = 11;
const BENCH_COUNT = 7;

type PlayerTier = 'elite' | 'high' | 'standard';

const TIER_THRESHOLDS: Record<PlayerTier, number> = {
  elite: 88,
  high: 85,
  standard: 0,
};

const TIER_PROBABILITIES: ReadonlyArray<[PlayerTier, number]> = [
  ['elite', 0.1],
  ['high', 0.4],
  ['standard', 0.5],
];

const getPlayerTier = (player: Player): PlayerTier => {
  if (player.rating >= TIER_THRESHOLDS.elite) {
    return 'elite';
  }
  if (player.rating >= TIER_THRESHOLDS.high) {
    return 'high';
  }
  return 'standard';
};

const bucketPlayers = (players: Player[]): Record<PlayerTier, Player[]> => {
  return players.reduce(
    (buckets, player) => {
      const tier = getPlayerTier(player);
      buckets[tier].push(player);
      return buckets;
    },
    { elite: [] as Player[], high: [] as Player[], standard: [] as Player[] },
  );
};

const getRandomElement = <T,>(items: readonly T[]): T | null => {
  if (items.length === 0) {
    return null;
  }

  const index = Math.floor(Math.random() * items.length);
  return items[index];
};

const sampleTier = (): PlayerTier => {
  const threshold = Math.random();
  let running = 0;

  for (const [tier, weight] of TIER_PROBABILITIES) {
    running += weight;
    if (threshold <= running) {
      return tier;
    }
  }

  return TIER_PROBABILITIES[TIER_PROBABILITIES.length - 1][0];
};

const sampleUniquePlayers = (players: Player[], count: number): Player[] => {
  const buckets = bucketPlayers(players);
  const unique: Player[] = [];
  const usedIds = new Set<number>();

  while (unique.length < count && usedIds.size < players.length) {
    const tier = sampleTier();
    const candidates = buckets[tier].filter((player) => !usedIds.has(player.id));
    let pick = getRandomElement(candidates);

    if (!pick) {
      const remaining = players.filter((player) => !usedIds.has(player.id));
      pick = getRandomElement(remaining);
    }

    if (!pick) {
      break;
    }

    unique.push(pick);
    usedIds.add(pick.id);
  }

  const remaining = players.filter((player) => !usedIds.has(player.id));
  while (unique.length < count && remaining.length > 0) {
    const next = getRandomElement(remaining);
    if (!next) {
      break;
    }

    unique.push(next);
    usedIds.add(next.id);
    const nextIndex = remaining.findIndex((player) => player.id === next.id);
    remaining.splice(nextIndex, 1);
  }

  return unique.slice(0, count);
};

const fetchPlayersForSlot = async (positions: readonly string[]): Promise<Player[]> => {
  let query = supabase.from('players').select('*');
  if (positions.length > 0) {
    query = query.in('position', positions);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  const players = (data ?? []) as Player[];
  if (players.length === 0) {
    throw new Error(
      positions.length > 0
        ? `No players found for positions: ${positions.join(', ')}`
        : 'No players found for the bench pool.',
    );
  }

  return players;
};

interface UseDraftResult {
  draftStatus: DraftStatus;
  currentSlotIndex: number;
  currentChoices: Player[];
  startingXI: Player[];
  bench: Player[];
  loading: boolean;
  error: string | null;
  startDraft: () => Promise<void>;
  selectPlayer: (player: Player) => Promise<void>;
  restartDraft: () => Promise<void>;
}

export const useDraft = (): UseDraftResult => {
  const [draftStatus, setDraftStatus] = useState<DraftStatus>('idle');
  const [currentSlotIndex, setCurrentSlotIndex] = useState<number>(0);
  const [currentChoices, setCurrentChoices] = useState<Player[]>([]);
  const [startingXI, setStartingXI] = useState<Player[]>([]);
  const [bench, setBench] = useState<Player[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const clearState = useCallback(() => {
    setDraftStatus('idle');
    setCurrentSlotIndex(0);
    setCurrentChoices([]);
    setStartingXI([]);
    setBench([]);
    setError(null);
  }, []);

  const generateChoicesForSlot = useCallback(
    async (index: number) => {
      const positions = SLOT_POSITION_MAP[index];
      setLoading(true);
      setError(null);

      try {
        const players = await fetchPlayersForSlot(positions);
        const sampled = sampleUniquePlayers(players, CHOICE_COUNT);

        if (sampled.length < CHOICE_COUNT) {
          throw new Error('Unable to generate enough draft choices for this slot.');
        }

        setCurrentChoices(sampled);
      } catch (fetchError: unknown) {
        const message = fetchError instanceof Error ? fetchError.message : 'Draft generation failed.';
        setError(message);
        setCurrentChoices([]);
        setDraftStatus('idle');
        setCurrentSlotIndex(0);
        setStartingXI([]);
        setBench([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const startDraft = useCallback(async () => {
    clearState();
    setDraftStatus('drafting');
    setCurrentSlotIndex(0);
    setStartingXI([]);
    setBench([]);
    await generateChoicesForSlot(0);
  }, [clearState, generateChoicesForSlot]);

  const selectPlayer = useCallback(
    async (player: Player) => {
      if (loading || draftStatus !== 'drafting') {
        return;
      }

      const nextSlotIndex = currentSlotIndex + 1;

      if (currentSlotIndex < STARTING_COUNT) {
        setStartingXI((current) => [...current, player]);
      } else {
        setBench((current) => [...current, player]);
      }

      if (nextSlotIndex >= STARTING_COUNT + BENCH_COUNT) {
        setCurrentSlotIndex(nextSlotIndex);
        setCurrentChoices([]);
        setDraftStatus('finished');
        return;
      }

      setCurrentSlotIndex(nextSlotIndex);
      await generateChoicesForSlot(nextSlotIndex);
    },
    [currentSlotIndex, draftStatus, generateChoicesForSlot, loading],
  );

  const restartDraft = useCallback(async () => {
    clearState();
    await startDraft();
  }, [clearState, startDraft]);

  return {
    draftStatus,
    currentSlotIndex,
    currentChoices,
    startingXI,
    bench,
    loading,
    error,
    startDraft,
    selectPlayer,
    restartDraft,
  };
};
