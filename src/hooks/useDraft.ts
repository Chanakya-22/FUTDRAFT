import { useCallback, useMemo, useState } from 'react';
import { supabase } from '../api/supabaseClient';
import { Player } from '../types';

const TARGET_SQUAD_SIZE = 11;
const MAX_ATTEMPTS = 3;

interface FormationRequirement {
  name: string;
  positions: string[];
  count: number;
}

type RatingTier = 'high' | 'mid' | 'base';

const FORMATION_REQUIREMENTS: FormationRequirement[] = [
  { name: 'Goalkeepers', positions: ['GK'], count: 1 },
  { name: 'Defenders', positions: ['LB', 'CB', 'RB'], count: 4 },
  { name: 'Midfielders', positions: ['CM', 'CAM', 'RM', 'LM', 'CDM'], count: 3 },
  { name: 'Attackers', positions: ['ST', 'LW', 'RW'], count: 3 },
];

const TIER_THRESHOLDS = {
  high: 85,
  mid: 75,
};

const getRatingTier = (player: Player): RatingTier => {
  if (player.rating >= TIER_THRESHOLDS.high) {
    return 'high';
  }
  if (player.rating >= TIER_THRESHOLDS.mid) {
    return 'mid';
  }
  return 'base';
};

const bucketPlayers = (players: Player[]) => {
  const buckets: Record<RatingTier, Player[]> = {
    high: [],
    mid: [],
    base: [],
  };

  players.forEach((player) => {
    buckets[getRatingTier(player)].push(player);
  });

  return buckets;
};

const getRandomElement = <T,>(items: T[]): T | null => {
  if (items.length === 0) {
    return null;
  }
  return items[Math.floor(Math.random() * items.length)];
};

const removePlayerById = (players: Player[], id: number) => players.filter((player) => player.id !== id);

const createDistributedSample = (players: Player[], count: number): Player[] => {
  const buckets = bucketPlayers(players);
  const selected: Player[] = [];

  const tierWeights: Record<RatingTier, number> = {
    high: 0.4,
    mid: 0.4,
    base: 0.2,
  };

  const getAvailableTier = (): RatingTier => {
    const availableTiers = (Object.keys(buckets) as RatingTier[]).filter(
      (tier) => buckets[tier].length > 0,
    );

    if (availableTiers.length === 0) {
      return 'base';
    }

    const weighted = availableTiers.map((tier) => ({ tier, weight: tierWeights[tier] }));
    const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0);
    const threshold = Math.random() * totalWeight;
    let running = 0;

    for (const item of weighted) {
      running += item.weight;
      if (threshold <= running) {
        return item.tier;
      }
    }

    return weighted[weighted.length - 1].tier;
  };

  while (selected.length < count && selected.length < players.length) {
    const tier = getAvailableTier();
    const bucket = buckets[tier];
    let picked = getRandomElement(bucket);

    if (!picked) {
      const fallbackTier = (Object.keys(buckets) as RatingTier[]).find(
        (nextTier) => buckets[nextTier].length > 0,
      );
      picked = fallbackTier ? getRandomElement(buckets[fallbackTier]) : null;
    }

    if (!picked) {
      break;
    }

    selected.push(picked);
    buckets.high = removePlayerById(buckets.high, picked.id);
    buckets.mid = removePlayerById(buckets.mid, picked.id);
    buckets.base = removePlayerById(buckets.base, picked.id);
  }

  const remaining = players.filter((player) => !selected.some((item) => item.id === player.id));
  while (selected.length < count && remaining.length > 0) {
    const next = getRandomElement(remaining);
    if (!next) break;
    selected.push(next);
    remaining.splice(remaining.findIndex((player) => player.id === next.id), 1);
  }

  return selected.slice(0, count);
};

const fetchPlayersByPositions = async (positions: string[], limit: number): Promise<Player[]> => {
  const response = await supabase.from('players').select('*').in('position', positions);
  const { data, error } = response;

  if (error) {
    throw error;
  }

  const players = (data ?? []) as Player[];
  if (players.length === 0) {
    throw new Error(`No players found for positions: ${positions.join(', ')}`);
  }

  return createDistributedSample(players, limit);
};

const sortByPositionGroup = (players: Player[]): Player[] => {
  const order: Record<string, number> = {
    GK: 0,
    LB: 1,
    CB: 1,
    RB: 1,
    CM: 2,
    CAM: 2,
    RM: 2,
    LM: 2,
    CDM: 2,
    ST: 3,
    LW: 3,
    RW: 3,
  };

  return [...players].sort((left, right) => {
    const groupDiff = (order[left.position] ?? 99) - (order[right.position] ?? 99);
    if (groupDiff !== 0) {
      return groupDiff;
    }
    return right.rating - left.rating;
  });
};

export const useDraft = () => {
  const [squad, setSquad] = useState<Player[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateDraft = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let finalSquad: Player[] = [];
      let attempt = 0;

      while (finalSquad.length < TARGET_SQUAD_SIZE && attempt < MAX_ATTEMPTS) {
        attempt += 1;

        const positionPromises = FORMATION_REQUIREMENTS.map((req) =>
          fetchPlayersByPositions(req.positions, req.count),
        );

        const results = await Promise.all(positionPromises);
        finalSquad = sortByPositionGroup(results.flat());

        if (finalSquad.length < TARGET_SQUAD_SIZE) {
          finalSquad = [];
        }
      }

      if (finalSquad.length !== TARGET_SQUAD_SIZE) {
        throw new Error(
          `Unable to form a valid 4-3-3 squad (got ${finalSquad.length}/11 players). Try again.`,
        );
      }

      setSquad(finalSquad);
      setSelectedIds([]);
    } catch (catchError: unknown) {
      const message = catchError instanceof Error ? catchError.message : 'Drafting failed';
      setError(message);
      setSquad([]);
      setSelectedIds([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleSelection = useCallback((playerId: number) => {
    setSelectedIds((current) => {
      if (current.includes(playerId)) {
        return current.filter((id) => id !== playerId);
      }
      if (current.length >= TARGET_SQUAD_SIZE) {
        return current;
      }
      return [...current, playerId];
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const selectedSquad = useMemo(
    () => squad.filter((player) => selectedIds.includes(player.id)),
    [squad, selectedIds],
  );

  return {
    squad,
    selectedIds,
    selectedSquad,
    loading,
    error,
    generateDraft,
    toggleSelection,
    clearSelection,
  } as const;
};
