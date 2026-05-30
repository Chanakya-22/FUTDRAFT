import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, View, Pressable, Text, ActivityIndicator } from 'react-native';
import DraftScreen from './src/screens/DraftScreen';
import MatchScreen from './src/screens/MatchScreen';
import PackScreen from './src/screens/PackScreen';
import { SquadProvider } from './src/context/SquadContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import MyPlayersScreen from './src/screens/MyPlayersScreen';

const DraftScreenWithNav = DraftScreen as React.ComponentType<{ navigateToMatch: () => void }>;

function MainApp() {
  const { session, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<'draft' | 'match' | 'packs' | 'myclub'>('draft');
  const [isLoginView, setIsLoginView] = useState(true);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#1f8cff" />
      </SafeAreaView>
    );
  }

  if (!session) {
    return isLoginView ? (
      <LoginScreen onNavigateToSignup={() => setIsLoginView(false)} />
    ) : (
      <SignupScreen onNavigateToLogin={() => setIsLoginView(true)} />
    );
  }

  return (
    <SquadProvider>
      <SafeAreaView style={styles.container}>
        {currentTab === 'draft' && <DraftScreenWithNav navigateToMatch={() => setCurrentTab('match')} />}
        {currentTab === 'match' && <MatchScreen />}
        {currentTab === 'packs' && <PackScreen />}
        {currentTab === 'myclub' && <MyPlayersScreen />}

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
          
          <Pressable
            style={({ pressed }) => [styles.tabButton, currentTab === 'myclub' && styles.tabActive, pressed && styles.tabPressed]}
            onPress={() => setCurrentTab('myclub')}
          >
            <Text style={[styles.tabText, currentTab === 'myclub' && styles.tabTextActive]}>My Club</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </SquadProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
