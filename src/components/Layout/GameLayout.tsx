import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

interface GameLayoutProps {
  children: React.ReactNode;
}

export const GameLayout: React.FC<GameLayoutProps> = ({ children }) => {
  return (
    <LinearGradient
      colors={['#040609', '#0a0f1a', '#040609']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {children}
      </SafeAreaView>
    </LinearGradient>
  );
};
