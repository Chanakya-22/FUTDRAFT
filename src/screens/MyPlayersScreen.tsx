import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { supabase } from '../api/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { PlayerCard } from '../components/Card/PlayerCard';
import { Player } from '../types';
import { GameLayout } from '../components/Layout/GameLayout';

interface MyPlayerRow {
  id: number;
  quantity: number;
  player_data: any;
}

type FilterType = 'ALL' | 'ATT' | 'MID' | 'DEF' | 'GK';

const MyPlayersScreen: React.FC = () => {
  const { user } = useAuth();
  const [players, setPlayers] = useState<MyPlayerRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');

  // Bulletproof Data Extractor
  const getPlayerData = (rawData: any): Player | null => {
    if (!rawData) return null;
    
    let pd = rawData;
    // Force parse if Supabase returned stringified JSON
    if (typeof pd === 'string') {
      try { pd = JSON.parse(pd); } catch (e) { return null; }
    }
    
    // Check all possible nested paths
    if (pd.name && pd.rating) return pd as Player;
    if (pd.player?.name) return pd.player as Player;
    if (pd.player_data?.name) return pd.player_data as Player;
    
    return null; 
  };

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

      // Sort Default: Highest to Lowest Rating
      const sortedData = (data as MyPlayerRow[]).sort((a, b) => {
        const pA = getPlayerData(a.player_data);
        const pB = getPlayerData(b.player_data);
        return (pB?.rating || 0) - (pA?.rating || 0);
      });

      setPlayers(sortedData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch players');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchClub();
  }, [fetchClub]);

  // Apply the specific position rules you requested
  const filteredPlayers = players.filter((item) => {
    if (activeFilter === 'ALL') return true;
    
    const player = getPlayerData(item.player_data);
    if (!player) return false;

    const pos = player.position;
    if (activeFilter === 'ATT') return ['ST', 'LW', 'RW', 'CF'].includes(pos);
    if (activeFilter === 'MID') return ['CM', 'CDM', 'CAM', 'LM', 'RM'].includes(pos);
    if (activeFilter === 'DEF') return ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(pos);
    if (activeFilter === 'GK') return ['GK'].includes(pos);
    
    return true;
  });

  const FilterButton = ({ title, filter }: { title: string, filter: FilterType }) => (
    <TouchableOpacity 
      style={[styles.filterBtn, activeFilter === filter && styles.filterBtnActive]}
      onPress={() => setActiveFilter(filter)}
    >
      <Text style={[styles.filterBtnText, activeFilter === filter && styles.filterBtnTextActive]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderItem = ({ item }: { item: MyPlayerRow }) => {
    const playerData = getPlayerData(item.player_data);

    if (!playerData) return null;

    return (
      <View style={styles.cardContainer}>
        {/* Exactly mimicking the DraftScreen rendering */}
        <PlayerCard player={playerData} selected={false} onPress={() => {}} />
        
        {item.quantity > 1 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>x{item.quantity}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <GameLayout>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>MY CLUB</Text>
          <Text style={styles.subtitle}>All the players you have collected.</Text>
        </View>
        <TouchableOpacity onPress={fetchClub}>
          <Text style={styles.refreshBtnText}>↻ Refresh</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}>
          <FilterButton title="All" filter="ALL" />
          <FilterButton title="Attackers" filter="ATT" />
          <FilterButton title="Midfielders" filter="MID" />
          <FilterButton title="Defenders" filter="DEF" />
          <FilterButton title="GKs" filter="GK" />
        </ScrollView>
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
          data={filteredPlayers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
             <View style={styles.centerArea}>
               <Text style={styles.emptyText}>No players found for this position.</Text>
             </View>
          }
        />
      )}
    </GameLayout>
  );
};

export default MyPlayersScreen;

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 20 },
  header: { marginBottom: 10, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: '#ffffff', fontSize: 26, fontWeight: '900', letterSpacing: 1 },
  subtitle: { color: '#b3b3b3', fontSize: 14, marginTop: 4 },
  
  filterWrapper: { marginBottom: 15 },
  filterContainer: { paddingHorizontal: 16, gap: 10 },
  filterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#333333',
    marginRight: 8,
  },
  filterBtnActive: {
    backgroundColor: '#1f8cff',
    borderColor: '#1f8cff',
  },
  filterBtnText: { color: '#888888', fontSize: 13, fontWeight: 'bold' },
  filterBtnTextActive: { color: '#ffffff' },
  refreshBtnText: { color: '#1f8cff', fontSize: 14, fontWeight: 'bold' },

  centerArea: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#888888', fontSize: 16, textAlign: 'center' },
  errorText: { color: '#ff6b6b', fontSize: 16, textAlign: 'center' },
  
  listContent: { paddingBottom: 100, paddingHorizontal: 16 }, // Matches DraftScreen padding
  cardContainer: {
    position: 'relative',
    marginBottom: 4, // PlayerCard already has bottom margin, this just stacks them cleanly
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    zIndex: 100,
    backgroundColor: '#1f8cff',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: '#070707', 
  },
  badgeText: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
});