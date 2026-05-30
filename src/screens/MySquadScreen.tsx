import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, ActivityIndicator, Alert, FlatList } from 'react-native';
import { supabase } from '../api/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { PlayerCard } from '../components/Card/PlayerCard';
import { Player } from '../types';

type PositionSlot = 'LW' | 'ST' | 'RW' | 'CM1' | 'CDM' | 'CM2' | 'LB' | 'CB1' | 'CB2' | 'RB' | 'GK';

const PITCH_LAYOUT: PositionSlot[][] = [
  ['LW', 'ST', 'RW'],
  ['CM1', 'CDM', 'CM2'],
  ['LB', 'CB1', 'CB2', 'RB'],
  ['GK'],
];

const getValidPositions = (slot: PositionSlot): string[] => {
  if (slot === 'LW') return ['LW', 'LM'];
  if (slot === 'RW') return ['RW', 'RM'];
  if (slot === 'ST') return ['ST', 'CF'];
  if (slot === 'CM1' || slot === 'CM2') return ['CM', 'CAM', 'CDM'];
  if (slot === 'CDM') return ['CDM', 'CM'];
  if (slot === 'LB') return ['LB', 'LWB'];
  if (slot === 'RB') return ['RB', 'RWB'];
  if (slot === 'CB1' || slot === 'CB2') return ['CB'];
  if (slot === 'GK') return ['GK'];
  return [];
};

const getPlayerData = (rawData: any): Player | null => {
  if (!rawData) return null;
  let pd = rawData;
  if (typeof pd === 'string') {
    try { pd = JSON.parse(pd); } catch (e) { return null; }
  }
  if (pd.name && pd.rating) return pd as Player;
  if (pd.player?.name) return pd.player as Player;
  if (pd.player_data?.name) return pd.player_data as Player;
  return null;
};

const MySquadScreen: React.FC = () => {
  const { user } = useAuth();
  const [squad, setSquad] = useState<Partial<Record<PositionSlot, Player>>>({});
  const [selectedSlot, setSelectedSlot] = useState<PositionSlot | null>(null);
  const [ownedPlayers, setOwnedPlayers] = useState<Player[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState<boolean>(false);

  // Load saved squad on mount
  useEffect(() => {
    const loadSquad = async () => {
      if (!user) return;
      const { data, error } = await supabase.from('my_squad').select('squad_data').eq('user_id', user.id).single();
      if (!error && data?.squad_data) {
        setSquad(data.squad_data);
      }
    };
    loadSquad();
  }, [user]);

  // Persist squad on change
  const saveSquadToDB = async (newSquad: Partial<Record<PositionSlot, Player>>) => {
    if (!user) return;
    try {
      await supabase.from('my_squad').upsert(
        { user_id: user.id, squad_data: newSquad },
        { onConflict: 'user_id' }
      );
    } catch (e) {
      console.error('Failed to save squad locally:', e);
    }
  };

  // Query players when a slot is tapped
  const handleSlotPress = useCallback(async (slot: PositionSlot) => {
    if (!user) return;
    setSelectedSlot(slot);
    setLoadingPlayers(true);
    
    try {
      const { data, error } = await supabase.from('my_players').select('player_data').eq('user_id', user.id);
      if (error) throw error;
      
      const validPos = getValidPositions(slot);
      const extracted: Player[] = [];
      
      data?.forEach((row: any) => {
        const p = getPlayerData(row.player_data);
        if (p && validPos.includes(p.position)) {
          // Simple distinct check
          if (!extracted.find((e) => e.id === p.id)) {
            extracted.push(p);
          }
        }
      });
      
      // Sort by rating
      extracted.sort((a, b) => b.rating - a.rating);
      setOwnedPlayers(extracted);
    } catch (err: any) {
      Alert.alert('Error', 'Failed to fetch players for this position.');
    } finally {
      setLoadingPlayers(false);
    }
  }, [user]);

  const handleSelectPlayer = (player: Player) => {
    if (!selectedSlot) return;
    const newSquad = { ...squad, [selectedSlot]: player };
    setSquad(newSquad);
    saveSquadToDB(newSquad);
    setSelectedSlot(null);
  };

  const renderSlot = (slot: PositionSlot) => {
    const player = squad[slot];
    const isSelected = selectedSlot === slot;

    return (
      <Pressable key={slot} onPress={() => handleSlotPress(slot)} style={[styles.slotContainer, isSelected && styles.slotSelected]}>
        {player ? (
          <View style={styles.pitchCardWrapper}>
            <View style={styles.pitchCardScale}>
              <PlayerCard player={player} selected={false} onPress={() => handleSlotPress(slot)} />
            </View>
          </View>
        ) : (
          <View style={styles.emptySlot}>
            <Text style={styles.emptySlotText}>{slot}</Text>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>SQUAD BUILDER</Text>
        <Text style={styles.subtitle}>Construct a 4-3-3 using players from your club.</Text>
      </View>

      <View style={styles.pitch}>
        {PITCH_LAYOUT.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.pitchRow}>
            {row.map((slot) => renderSlot(slot))}
          </View>
        ))}
      </View>

      {selectedSlot && (
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHeader}>
             <Text style={styles.sheetTitle}>Select {selectedSlot}</Text>
             <Pressable onPress={() => setSelectedSlot(null)}>
               <Text style={styles.closeText}>Close</Text>
             </Pressable>
          </View>
          
          {loadingPlayers ? (
            <View style={styles.loaderArea}>
              <ActivityIndicator color="#1f8cff" size="large" />
            </View>
          ) : ownedPlayers.length === 0 ? (
            <View style={styles.loaderArea}>
              <Text style={styles.emptyText}>You don't own any valid players for {selectedSlot}.</Text>
            </View>
          ) : (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={ownedPlayers} // ownedPlayers is already perfectly un-wrapped
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ paddingHorizontal: 16, alignItems: 'center' }}
              renderItem={({ item }) => (
                // The strict bounding box wrapper for smooth swiping
                <View style={styles.sheetCardWrapper}>
                  <View style={styles.sheetCardScale}>
                    <PlayerCard player={item} selected={false} onPress={() => handleSelectPlayer(item)} />
                  </View>
                </View>
              )}
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

export default MySquadScreen;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#070707', paddingTop: 20 },
  header: { paddingHorizontal: 16, marginBottom: 20 },
  title: { color: '#ffffff', fontSize: 26, fontWeight: '900', letterSpacing: 1 },
  subtitle: { color: '#b3b3b3', fontSize: 14, marginTop: 4 },
  
  pitch: {
    flex: 1,
    backgroundColor: '#0a1a10',
    marginHorizontal: 10,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#11331a',
    paddingVertical: 20,
    justifyContent: 'space-around',
  },
  pitchRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  slotContainer: {
    width: 70,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  slotSelected: {
    borderWidth: 2,
    borderColor: '#1f8cff',
    backgroundColor: 'rgba(31, 140, 255, 0.2)',
  },
  pitchCardWrapper: {
    width: 70,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pitchCardScale: {
    transform: [{ scale: 0.45 }],
  },
  emptySlot: {
    width: 50,
    height: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptySlotText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  
  bottomSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 280, backgroundColor: '#111111',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderWidth: 1, borderColor: '#1f1f1f',
    padding: 16, zIndex: 100,
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  sheetTitle: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  closeText: { color: '#1f8cff', fontSize: 14, fontWeight: 'bold' },
  loaderArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#888888', textAlign: 'center' },
  
  // The magic layout fixes for the bottom sheet horizontal swipe
  sheetCardWrapper: { 
    width: 115, 
    height: 170, 
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4, 
  },
  sheetCardScale: {
    transform: [{ scale: 0.65 }], 
    marginTop: -20, 
  },
});