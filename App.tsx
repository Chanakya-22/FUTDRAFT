import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, View, Pressable, Text } from 'react-native';
import DraftScreen from './src/screens/DraftScreen';
import MatchScreen from './src/screens/MatchScreen';
import PackScreen from './src/screens/PackScreen';
import { SquadProvider } from './src/context/SquadContext';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'draft' | 'match' | 'packs'>('draft');

  return (
    <SquadProvider>
      <SafeAreaView style={styles.container}>
        {currentTab === 'draft' && <DraftScreen navigateToMatch={() => setCurrentTab('match')} />}
        {currentTab === 'match' && <MatchScreen />}
        {currentTab === 'packs' && <PackScreen />}

        <View style={styles.tabBar}>
          <Pressable
            style={({ pressed }) => [styles.tabButton, currentTab === 'draft' && styles.tabActive, pressed && styles.tabPressed]}
            onPress={() => setCurrentTab('draft')}
          >
            <Text style={[styles.tabText, currentTab === 'draft' && styles.tabTextActive]}>Draft</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.tabButton, currentTab === 'match' && styles.tabActive, pressed && styles.tabPressed]}
            onPress={() => setCurrentTab('match')}
          >
            <Text style={[styles.tabText, currentTab === 'match' && styles.tabTextActive]}>Match</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.tabButton, currentTab === 'packs' && styles.tabActive, pressed && styles.tabPressed]}
            onPress={() => setCurrentTab('packs')}
          >
            <Text style={[styles.tabText, currentTab === 'packs' && styles.tabTextActive]}>Packs</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </SquadProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d0d',
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    backgroundColor: '#070707',
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: '#151515',
  },
  tabPressed: {
    opacity: 0.8,
  },
  tabText: {
    color: '#888',
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#fff',
  },
});

