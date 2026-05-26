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

const FORMATION_REQUIREMENTS: FormationRequirement[] = [
  { name: 'Goalkeepers', positions: ['GK'], count: 1 },
  { name: 'Defenders', positions: ['LB', 'CB', 'RB'], count: 4 },
  { name: 'Midfielders', positions: ['CM', 'CAM', 'RM', 'LM', 'CDM'], count: 3 },
  { name: 'Attackers', positions: ['ST', 'LW', 'RW'], count: 3 },
];

const fetchPlayersByPositions = async (positions: string[], limit: number): Promise<Player[]> => {
  const response = await supabase
    .from('players')
    .select('*')
    .in('position', positions)
    .limit(limit * 3);

  const { data, error } = response;
  if (error) {
    throw error;
  }

  const players = (data ?? []) as Player[];
  if (players.length === 0) {
    throw new Error(`No players found for positions: ${positions.join(', ')}`);
  }

  const shuffled = [...players].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, limit);
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
        finalSquad = results.flat();

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
