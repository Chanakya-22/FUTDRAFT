import React, { createContext, ReactNode, useContext, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../api/supabaseClient';
import { useAuth } from './AuthContext';
import { Player } from '../types';

interface SquadContextValue {
  startingXI: Player[];
  bench: Player[];
  commitSquad: (startingXI: Player[], bench: Player[]) => void;
  clearSquad: () => void;
  saveDraftToCloud: (startingXI: Player[], bench: Player[]) => Promise<void>;
}

const SquadContext = createContext<SquadContextValue | undefined>(undefined);

interface SquadProviderProps {
  children: ReactNode;
}

export const SquadProvider: React.FC<SquadProviderProps> = ({ children }) => {
  const [startingXI, setStartingXI] = useState<Player[]>([]);
  const [bench, setBench] = useState<Player[]>([]);
  const { user } = useAuth();

  const commitSquad = (startingXI: Player[], bench: Player[]) => {
    setStartingXI(startingXI);
    setBench(bench);
  };

  const clearSquad = () => {
    setStartingXI([]);
    setBench([]);
  };

  const saveDraftToCloud = async (finalXI: Player[], finalBench: Player[]) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to save drafts.');
      return;
    }
    try {
      const { error } = await supabase.from('saved_drafts').insert({
        user_id: user.id,
        starting_xi: finalXI,
        bench: finalBench,
      });
      if (error) throw error;
      Alert.alert('Success', 'Draft saved to database successfully!');
    } catch (e: any) {
      Alert.alert('Error saving draft', e.message || 'Unknown error occurred');
    }
  };

  return (
    <SquadContext.Provider value={{ startingXI, bench, commitSquad, clearSquad, saveDraftToCloud }}>
      {children}
    </SquadContext.Provider>
  );
};

export const useSquad = (): SquadContextValue => {
  const context = useContext(SquadContext);
  if (!context) {
    throw new Error('useSquad must be used within a SquadProvider');
  }
  return context;
};
