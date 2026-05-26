import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { supabase } from './src/api/supabaseClient';
import { Player } from './src/types';

export default function App() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlayer() {
      try {
        const { data, error } = await supabase
          .from<Player>('players')
          .select('*')
          .eq('id', 1)
          .maybeSingle();

        if (error) throw error;
        setPlayer(data ?? null);
      } catch (err: any) {
        setError(err?.message ?? 'Unknown Supabase error');
        console.error('Supabase error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPlayer();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text>Error: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {player ? (
        <Text style={styles.text}>
          {player.name} - {player.rating}
        </Text>
      ) : (
        <Text>Player not found</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
