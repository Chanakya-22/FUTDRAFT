import { useCallback, useMemo, useState } from 'react';
import { supabase } from '../api/supabaseClient';
import { Player } from '../types';

const MAX_PLAYER_ID = 800;
const TARGET_SQUAD_SIZE = 11;
const MAX_ATTEMPTS = 3;

const generateRandomIds = (count: number): number[] => {
  const ids = new Set<number>();
  while (ids.size < count) {
    ids.add(Math.floor(Math.random() * MAX_PLAYER_ID) + 1);
  }
  return Array.from(ids);
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
      let players: Player[] = [];
      let attempt = 0;

      while (players.length < TARGET_SQUAD_SIZE && attempt < MAX_ATTEMPTS) {
        attempt += 1;
        const candidateCount = TARGET_SQUAD_SIZE * 2;
        const randomIds = generateRandomIds(candidateCount);
        const response = await supabase
          .from('players')
          .select('*')
          .in('id', randomIds)
          .limit(TARGET_SQUAD_SIZE);

        const { data, error } = response;
        if (error) {
          throw error;
        }

        const loadedPlayers = (data ?? []) as Player[];
        if (loadedPlayers.length > players.length) {
          players = loadedPlayers.slice(0, TARGET_SQUAD_SIZE);
        }
      }

      if (players.length !== TARGET_SQUAD_SIZE) {
        throw new Error('Unable to generate a full squad of 11 players. Try again.');
      }

      setSquad(players);
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
