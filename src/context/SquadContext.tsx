import React, { createContext, ReactNode, useContext, useState } from 'react';
import { Player } from '../types';

interface SquadContextValue {
  startingXI: Player[];
  bench: Player[];
  commitSquad: (startingXI: Player[], bench: Player[]) => void;
  clearSquad: () => void;
}

const SquadContext = createContext<SquadContextValue | undefined>(undefined);

interface SquadProviderProps {
  children: ReactNode;
}

export const SquadProvider: React.FC<SquadProviderProps> = ({ children }) => {
  const [startingXI, setStartingXI] = useState<Player[]>([]);
  const [bench, setBench] = useState<Player[]>([]);

  const commitSquad = (startingXI: Player[], bench: Player[]) => {
    setStartingXI(startingXI);
    setBench(bench);
  };

  const clearSquad = () => {
    setStartingXI([]);
    setBench([]);
  };

  return (
    <SquadContext.Provider value={{ startingXI, bench, commitSquad, clearSquad }}>
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
