import { useCallback, useContext, useState } from 'react';
import { supabase } from '../api/supabaseClient';
import { AuthContext } from '../context/AuthContext';
import { Player } from '../types';

export type PackType = 'STANDARD' | 'DELUXE' | 'ULTRA';

type UsePackResult = {
  pulledPlayers: Player[];
  isOpening: boolean;
  error: string | null;
  userCoins: number;
  fetchBalance: () => Promise<void>;
  openPack: (packType: PackType) => Promise<void>;
  discard: () => void;
};

export const usePack = (): UsePackResult => {
  const authContext = useContext(AuthContext);
  const user = authContext?.session?.user;

  const [pulledPlayers, setPulledPlayers] = useState<Player[]>([]);
  const [isOpening, setIsOpening] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userCoins, setUserCoins] = useState<number>(0);

  const fetchBalance = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('user_balances')
        .select('coins')
        .eq('user_id', user.id)
        .single();
      
      if (!error && data) {
        setUserCoins(data.coins);
      }
    } catch (err) {
      console.error('Failed to fetch balance:', err);
    }
  }, [user]);

  const openPack = useCallback(async (packType: PackType): Promise<void> => {
    if (!user) {
      setError('User not authenticated.');
      return;
    }

    setIsOpening(true);
    setError(null);
    setPulledPlayers([]);

    const costs = { STANDARD: 1000, DELUXE: 2000, ULTRA: 3000 };
    const walkoutRatings = { STANDARD: 85, DELUXE: 88, ULTRA: 90 };

    const cost = costs[packType];
    const minWalkoutRating = walkoutRatings[packType];

    if (userCoins < cost) {
      setError('Insufficient Funds');
      setIsOpening(false);
      return;
    }

    try {
      // Query A: Walkout
      const { data: walkoutData, error: walkoutError } = await supabase
        .from('players')
        .select('*')
        .gte('rating', minWalkoutRating);

      if (walkoutError) throw walkoutError;
      if (!walkoutData || walkoutData.length === 0) {
        throw new Error('No walkout players found');
      }

      const walkoutPlayer = walkoutData[Math.floor(Math.random() * walkoutData.length)];

      // Query B: Fillers
      const { data: fillersData, error: fillersError } = await supabase
        .from('players')
        .select('*')
        .lt('rating', 85);

      if (fillersError) throw fillersError;
      if (!fillersData || fillersData.length < 10) {
        throw new Error('Not enough filler players found');
      }

      const shuffledFillers = fillersData.sort(() => 0.5 - Math.random()).slice(0, 10);
      const players = [walkoutPlayer, ...shuffledFillers];

      setPulledPlayers(players);

      // Deduct coins
      const newBalance = userCoins - cost;
      const { error: updateError } = await supabase
        .from('user_balances')
        .update({ coins: newBalance })
        .eq('user_id', user.id);

      if (updateError) throw updateError;
      setUserCoins(newBalance);

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
      console.error('Failed to open pack:', err);
      setError(err instanceof Error ? err.message : 'Failed to open pack');
      setPulledPlayers([]);
    } finally {
      setIsOpening(false);
    }
  }, [user, userCoins]);

  const discard = useCallback(() => {
    setPulledPlayers([]);
    setError(null);
  }, []);

  return {
    pulledPlayers,
    isOpening,
    error,
    userCoins,
    fetchBalance,
    openPack,
    discard,
  };
};
