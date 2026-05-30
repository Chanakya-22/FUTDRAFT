import { useCallback, useContext, useState } from 'react';
import { supabase } from '../api/supabaseClient';
import { AuthContext } from '../context/AuthContext';
import { Player } from '../types';

type Tier = 'high' | 'mid' | 'base';

type UsePackResult = {
  pulledPlayers: Player[];
  isOpening: boolean;
  error: string | null;
  openPack: () => Promise<void>;
  discard: () => void;
};

const getRandomIntInclusive = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const getTierForRoll = (roll: number): Tier => {
  if (roll <= 10) {
    return 'high';
  }
  if (roll <= 50) {
    return 'mid';
  }
  return 'base';
};

const addTierFilter = <T extends { gte: any; lte: any; lt: any }>(
  query: T,
  tier: Tier,
): T => {
  if (tier === 'high') {
    return query.gte('rating', 88);
  }
  if (tier === 'mid') {
    return query.gte('rating', 86).lte('rating', 87);
  }
  return query.lt('rating', 86);
};

const selectRandomPlayerForTier = async (tier: Tier): Promise<Player> => {
  let countQuery = supabase.from('players').select('id', { count: 'exact' });
  countQuery = addTierFilter(countQuery, tier);

  const countResp = await countQuery;
  if (countResp.error) {
    throw countResp.error;
  }

  const total = typeof countResp.count === 'number'
    ? countResp.count
    : Array.isArray(countResp.data)
      ? countResp.data.length
      : 0;

  if (total <= 0) {
    throw new Error('No players available for the pulled tier');
  }

  const offset = Math.floor(Math.random() * total);
  let rowQuery = supabase.from('players').select('*').range(offset, offset);
  rowQuery = addTierFilter(rowQuery, tier);

  const rowResp = await rowQuery;
  if (rowResp.error) {
    throw rowResp.error;
  }

  const players = (rowResp.data ?? []) as Player[];
  if (players.length === 0) {
    throw new Error('Failed to retrieve player for the pulled tier');
  }

  return players[0];
};

export const usePack = (): UsePackResult => {
  const authContext = useContext(AuthContext);
  const user = authContext?.session?.user;

  const [pulledPlayers, setPulledPlayers] = useState<Player[]>([]);
  const [isOpening, setIsOpening] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const openPack = useCallback(async (): Promise<void> => {
    setIsOpening(true);
    setError(null);
    setPulledPlayers([]);

    try {
      const players = await Promise.all(
        Array.from({ length: 5 }, () => {
          const roll = getRandomIntInclusive(1, 100);
          const tier = getTierForRoll(roll);
          return selectRandomPlayerForTier(tier);
        }),
      );

      setPulledPlayers(players);

      // Background execution for saving players to the user's club
      if (user) {
        const savePackToMyClub = async () => {
          try {
            // 1. Fetch the user's current club
            const { data: existingClub, error: fetchClubError } = await supabase
              .from('my_players')
              .select('id, quantity, player_data')
              .eq('user_id', user.id);

            if (fetchClubError) {
              throw fetchClubError;
            }

            // 2. Group the packedPlayers locally
            const aggregated: Record<number, { player: Player; quantity: number }> = {};
            for (const player of players) {
              if (!aggregated[player.id]) {
                aggregated[player.id] = { player, quantity: 0 };
              }
              aggregated[player.id].quantity += 1;
            }

            // 3. Loop through the grouped new players
            for (const key in aggregated) {
              const { player: newPlayer, quantity: newQuantity } = aggregated[key];

              // 4. Check if they exist in existingClub
              const existingRow = existingClub?.find((row: any) => row.player_data.id === newPlayer.id);

              if (existingRow) {
                // 5. If found: Execute an update
                const { error: updateError } = await supabase
                  .from('my_players')
                  .update({ quantity: existingRow.quantity + newQuantity })
                  .eq('id', existingRow.id);

                if (updateError) throw updateError;
              } else {
                // 6. If NOT found: Execute an insert
                const { error: insertError } = await supabase
                  .from('my_players')
                  .insert({
                    user_id: user.id,
                    player_data: newPlayer,
                    quantity: newQuantity,
                  });

                if (insertError) throw insertError;
              }
            }
          } catch (saveError) {
            // Step C: Fail silently in the background
            console.error('Failed to save players to my_players:', saveError);
          }
        };

        savePackToMyClub();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to open pack');
      setPulledPlayers([]);
    } finally {
      setIsOpening(false);
    }
  }, [user]);

  const discard = useCallback(() => {
    setPulledPlayers([]);
    setError(null);
  }, []);

  return {
    pulledPlayers,
    isOpening,
    error,
    openPack,
    discard,
  };
};
