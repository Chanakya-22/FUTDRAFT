import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView, Dimensions } from 'react-native';
import { supabase } from '../api/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { PlayerCard } from '../components/Card/PlayerCard';
import { Player } from '../types';

interface MyPlayerRow {
  id: number;
  quantity: number;
  player_data: Player;
}

const screenWidth = Dimensions.get('window').width;
const itemWidth = screenWidth / 3;

const MyPlayersScreen: React.FC = () => {
  const { user } = useAuth();
  const [players, setPlayers] = useState<MyPlayerRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClub = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('my_players')
        .select('*')
        .eq('user_id', user.id);

      if (fetchError) throw fetchError;

      // Sort by player rating (highest to lowest)
      const sortedData = (data as MyPlayerRow[]).sort((a, b) => {
        return (b.player_data?.rating || 0) - (a.player_data?.rating || 0);
      });

      setPlayers(sortedData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch players');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Because this component mounts/unmounts via App.tsx conditional rendering, 
  // this effect acts effectively like an on-focus listener.
  useEffect(() => {
    fetchClub();
  }, [fetchClub]);

  const renderItem = ({ item }: { item: MyPlayerRow }) => {
    if (!item.player_data) return null;
    
    const playerData = item.player_data?.name 
      ? item.player_data 
      : ((item.player_data as any)?.player || (item.player_data as any)?.player_data || item.player_data);

    if (!playerData || !playerData.name || !playerData.rating) return null;

    return (
      <View style={{ width: itemWidth, height: 190, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ transform: [{ scale: 0.65 }] }}>
          <PlayerCard player={playerData} selected={false} onPress={() => {}} />
        </View>
        {item.quantity > 1 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>x{item.quantity}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>MY CLUB</Text>
        <Text style={styles.subtitle}>All the players you have collected.</Text>
      </View>
      
      {loading ? (
        <View style={styles.centerArea}>
          <ActivityIndicator size="large" color="#1f8cff" />
        </View>
      ) : error ? (
        <View style={styles.centerArea}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : players.length === 0 ? (
        <View style={styles.centerArea}>
          <Text style={styles.emptyText}>Your club is empty. Go open some packs.</Text>
        </View>
      ) : (
        <FlatList
          data={players}
          keyExtractor={(item) => item.id.toString()}
          numColumns={3}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
};

export default MyPlayersScreen;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#070707', paddingHorizontal: 16, paddingTop: 20 },
  header: { marginBottom: 16 },
  title: { color: '#ffffff', fontSize: 26, fontWeight: '900', letterSpacing: 1 },
  subtitle: { color: '#b3b3b3', fontSize: 14, marginTop: 4 },
  centerArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#888888', fontSize: 16, textAlign: 'center' },
  errorText: { color: '#ff6b6b', fontSize: 16, textAlign: 'center' },
  listContent: { paddingBottom: 100, paddingHorizontal: 10 },
  badge: { position: 'absolute', top: 5, right: 10, zIndex: 10, backgroundColor: '#1f8cff', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.8, shadowRadius: 3, elevation: 5, borderWidth: 1, borderColor: '#ffffff' },
  badgeText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },
});