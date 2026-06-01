import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, ActivityIndicator, Alert, FlatList, Modal, TextInput, TouchableOpacity } from 'react-native';
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

interface SavedSquad {
  id: string;
  name: string;
  squad: Partial<Record<PositionSlot, Player>>;
}

const MySquadScreen: React.FC = () => {
  const { user } = useAuth();
  
  // App States
  const [viewMode, setViewMode] = useState<'LIST' | 'PITCH'>('LIST');
  const [squadsList, setSquadsList] = useState<SavedSquad[]>([]);
  
  // Active Squad States
  const [activeSquadId, setActiveSquadId] = useState<string | null>(null);
  const [activeSquad, setActiveSquad] = useState<Partial<Record<PositionSlot, Player>>>({});
  const [squadNameInput, setSquadNameInput] = useState('');
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  
  // UI Interaction States
  const [selectedSlot, setSelectedSlot] = useState<PositionSlot | null>(null);
  const [actionMenuSlot, setActionMenuSlot] = useState<PositionSlot | null>(null);
  
  // Player Data States
  const [ownedPlayers, setOwnedPlayers] = useState<Player[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState<boolean>(false);

  // Load Saved Squads on Mount
  useEffect(() => {
    const loadSquads = async () => {
      if (!user) return;
      const { data, error } = await supabase.from('my_squad').select('squad_data').eq('user_id', user.id).single();
      
      if (!error && data?.squad_data) {
        // Handle migration from old single-squad format to new array format
        if (data.squad_data.squads) {
          setSquadsList(data.squad_data.squads);
        } else if (Object.keys(data.squad_data).length > 0) {
          // Legacy format conversion
          setSquadsList([{ id: 'legacy-1', name: 'My First Squad', squad: data.squad_data }]);
        }
      }
    };
    loadSquads();
  }, [user]);

  // Handle clicking an empty slot or clicking "Swap"
  const handleOpenSelection = useCallback(async (slot: PositionSlot) => {
    if (!user) return;
    setActionMenuSlot(null);
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
          if (!extracted.find((e) => e.id === p.id)) {
            extracted.push(p);
          }
        }
      });
      
      extracted.sort((a, b) => b.rating - a.rating);
      setOwnedPlayers(extracted);
    } catch (err: any) {
      Alert.alert('Error', 'Failed to fetch players.');
    } finally {
      setLoadingPlayers(false);
    }
  }, [user]);

  const handleSelectPlayer = (player: Player) => {
    if (!selectedSlot) return;
    setActiveSquad(prev => ({ ...prev, [selectedSlot]: player }));
    setSelectedSlot(null);
  };

  const handleRemovePlayer = () => {
    if (!actionMenuSlot) return;
    const newSquad = { ...activeSquad };
    delete newSquad[actionMenuSlot];
    setActiveSquad(newSquad);
    setActionMenuSlot(null);
  };

  const handleSaveSquad = async () => {
    if (!squadNameInput.trim()) {
      Alert.alert('Error', 'Please enter a squad name.');
      return;
    }

    const newSquadObj: SavedSquad = {
      id: activeSquadId || Date.now().toString(),
      name: squadNameInput,
      squad: activeSquad,
    };

    let updatedList = [...squadsList];
    if (activeSquadId) {
      const index = updatedList.findIndex(s => s.id === activeSquadId);
      if (index > -1) updatedList[index] = newSquadObj;
      else updatedList.push(newSquadObj);
    } else {
      updatedList.push(newSquadObj);
    }

    try {
      await supabase.from('my_squad').upsert(
        { user_id: user?.id, squad_data: { squads: updatedList } },
        { onConflict: 'user_id' }
      );
      setSquadsList(updatedList);
      setSaveModalVisible(false);
      setViewMode('LIST');
    } catch (e) {
      Alert.alert('Error', 'Failed to save squad to database.');
    }
  };

  // ---------------- RENDERS ---------------- //

  const renderSlot = (slot: PositionSlot) => {
    const player = activeSquad[slot];
    const isSelected = selectedSlot === slot || actionMenuSlot === slot;

    return (
      <Pressable 
        key={slot} 
        onPress={() => player ? setActionMenuSlot(slot) : handleOpenSelection(slot)} 
        style={[styles.slotContainer, isSelected && styles.slotSelected]}
      >
        {player ? (
          <View style={styles.pitchCardWrapper}>
             {/* STRICT ABSOLUTE SCALING FIX */}
            <View style={styles.pitchCardScale}>
              <PlayerCard player={player} selected={false} onPress={() => {}} />
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

  if (viewMode === 'LIST') {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.title}>MY SQUADS</Text>
          <Text style={styles.subtitle}>Manage and build your custom teams.</Text>
        </View>

        <TouchableOpacity 
          style={styles.createNewBtn} 
          onPress={() => {
            setActiveSquadId(null);
            setActiveSquad({});
            setSquadNameInput('');
            setViewMode('PITCH');
          }}
        >
          <Text style={styles.createNewBtnText}>+ CREATE NEW SQUAD</Text>
        </TouchableOpacity>

        <FlatList
          data={squadsList}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, marginTop: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.squadListItem}
              onPress={() => {
                setActiveSquadId(item.id);
                setActiveSquad(item.squad);
                setSquadNameInput(item.name);
                setViewMode('PITCH');
              }}
            >
              <Text style={styles.squadListName}>{item.name}</Text>
              <Text style={styles.squadListCount}>{Object.keys(item.squad).length}/11 Players</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>You haven't saved any squads yet.</Text>}
        />
      </SafeAreaView>
    );
  }

  // PITCH VIEW
  const playersPlaced = Object.keys(activeSquad).length;
  const isSquadFull = playersPlaced === 11;

  return (
    <SafeAreaView style={styles.screen}>
      {/* Dynamic Header for Pitch View */}
      <View style={styles.pitchHeader}>
        <TouchableOpacity onPress={() => setViewMode('LIST')}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.saveSquadBtn, !isSquadFull && styles.saveSquadBtnDisabled]}
          disabled={!isSquadFull}
          onPress={() => setSaveModalVisible(true)}
        >
          <Text style={styles.saveSquadBtnText}>
            {isSquadFull ? 'SAVE SQUAD' : `${playersPlaced}/11 PLACED`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* The 4-3-3 Pitch */}
      <View style={styles.pitch}>
        {PITCH_LAYOUT.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.pitchRow}>
            {row.map((slot) => renderSlot(slot))}
          </View>
        ))}
      </View>

      {/* 1. PLAYER SELECTION BOTTOM SHEET */}
      {selectedSlot && (
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHeader}>
             <Text style={styles.sheetTitle}>Select {selectedSlot}</Text>
             <Pressable onPress={() => setSelectedSlot(null)}>
               <Text style={styles.closeText}>Close</Text>
             </Pressable>
          </View>
          
          {loadingPlayers ? (
            <View style={styles.loaderArea}><ActivityIndicator color="#1f8cff" size="large" /></View>
          ) : ownedPlayers.length === 0 ? (
            <View style={styles.loaderArea}><Text style={styles.emptyText}>No valid players found.</Text></View>
          ) : (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={ownedPlayers}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ alignItems: 'center' }}
              renderItem={({ item }) => (
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

      {/* 2. ACTION MENU BOTTOM SHEET (View, Swap, Remove) */}
      {actionMenuSlot && activeSquad[actionMenuSlot] && (
        <View style={[styles.bottomSheet, { height: 320 }]}>
          <View style={styles.sheetHeader}>
             <Text style={styles.sheetTitle}>{activeSquad[actionMenuSlot]?.name} Options</Text>
             <Pressable onPress={() => setActionMenuSlot(null)}>
               <Text style={styles.closeText}>Close</Text>
             </Pressable>
          </View>
          
          <View style={styles.actionMenuContent}>
             <View style={styles.actionMenuCardWrapper}>
               <View style={styles.actionMenuCardScale}>
                 <PlayerCard player={activeSquad[actionMenuSlot] as Player} selected={false} onPress={() => {}} />
               </View>
             </View>
             
             <View style={styles.actionMenuButtons}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleOpenSelection(actionMenuSlot)}>
                  <Text style={styles.actionBtnText}>Swap Player</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDanger]} onPress={handleRemovePlayer}>
                  <Text style={styles.actionBtnTextDanger}>Remove</Text>
                </TouchableOpacity>
             </View>
          </View>
        </View>
      )}

      {/* 3. SAVE SQUAD MODAL */}
      <Modal visible={saveModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Save Squad</Text>
            <TextInput 
              style={styles.modalInput} 
              placeholder="Enter Squad Name (e.g. My Dream Team)" 
              placeholderTextColor="#666"
              value={squadNameInput}
              onChangeText={setSquadNameInput}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setSaveModalVisible(false)} style={styles.modalBtn}>
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveSquad} style={[styles.modalBtn, { backgroundColor: '#1f8cff' }]}>
                <Text style={[styles.modalBtnText, { color: '#fff' }]}>Confirm Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

export default MySquadScreen;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#070707', paddingTop: 20 },
  header: { paddingHorizontal: 16, marginBottom: 20 },
  title: { color: '#ffffff', fontSize: 26, fontWeight: '900', letterSpacing: 1 },
  subtitle: { color: '#b3b3b3', fontSize: 14, marginTop: 4 },
  
  // List View Styles
  createNewBtn: { marginHorizontal: 16, backgroundColor: '#1f8cff', padding: 15, borderRadius: 10, alignItems: 'center' },
  createNewBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
  squadListItem: { backgroundColor: '#111', padding: 16, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: '#333' },
  squadListName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  squadListCount: { color: '#888', marginTop: 5 },
  
  // Pitch View Header
  pitchHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 10 },
  backBtnText: { color: '#1f8cff', fontSize: 16, fontWeight: 'bold' },
  saveSquadBtn: { backgroundColor: '#28a745', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
  saveSquadBtnDisabled: { backgroundColor: '#333' },
  saveSquadBtnText: { color: '#fff', fontWeight: 'bold' },

  // Pitch Styles
  pitch: { flex: 1, backgroundColor: '#0a1a10', marginHorizontal: 10, borderRadius: 16, borderWidth: 2, borderColor: '#11331a', paddingVertical: 20, justifyContent: 'space-around' },
  pitchRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  
  slotContainer: { width: 70, height: 100, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  slotSelected: { borderWidth: 2, borderColor: '#1f8cff', backgroundColor: 'rgba(31, 140, 255, 0.2)' },
  
  // FIXED: Absolute Positioning removes the layout footprint so cards don't overlap
  pitchCardWrapper: { width: 70, height: 100, justifyContent: 'center', alignItems: 'center' },
  pitchCardScale: { position: 'absolute', transform: [{ scale: 0.43 }] },
  
  emptySlot: { width: 50, height: 70, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.3)', justifyContent: 'center', alignItems: 'center' },
  emptySlotText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  
  // Bottom Sheets
  bottomSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 260, backgroundColor: '#111111', borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, borderColor: '#222', padding: 16, zIndex: 100 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  sheetTitle: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  closeText: { color: '#1f8cff', fontSize: 14, fontWeight: 'bold' },
  loaderArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#888888', textAlign: 'center', marginTop: 20 },
  
  // FIXED: Horizontal Swipe Container
  sheetCardWrapper: { width: 110, height: 160, justifyContent: 'center', alignItems: 'center', marginHorizontal: 5 },
  sheetCardScale: { position: 'absolute', transform: [{ scale: 0.65 }] },

  // Action Menu
  actionMenuContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginTop: 10 },
  actionMenuCardWrapper: { width: 140, height: 200, justifyContent: 'center', alignItems: 'center' },
  actionMenuCardScale: { position: 'absolute', transform: [{ scale: 0.8 }] },
  actionMenuButtons: { flex: 1, paddingLeft: 20, gap: 15 },
  actionBtn: { backgroundColor: '#222', paddingVertical: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#444' },
  actionBtnDanger: { borderColor: '#ff4444', backgroundColor: 'rgba(255, 68, 68, 0.1)' },
  actionBtnText: { color: '#fff', fontWeight: 'bold' },
  actionBtnTextDanger: { color: '#ff4444', fontWeight: 'bold' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: '#111', padding: 20, borderRadius: 15, borderWidth: 1, borderColor: '#333' },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  modalInput: { backgroundColor: '#222', color: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#444', marginBottom: 20 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8 },
  modalBtnText: { color: '#888', fontWeight: 'bold' }
});