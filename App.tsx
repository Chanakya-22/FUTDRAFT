import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, View, Pressable, Text, ActivityIndicator } from 'react-native';
import DraftScreen from './src/screens/DraftScreen';
import MatchScreen from './src/screens/MatchScreen';
import PackScreen from './src/screens/PackScreen';
import { SquadProvider } from './src/context/SquadContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import MyPlayersScreen from './src/screens/MyPlayersScreen';
import MySquadScreen from './src/screens/MySquadScreen';
import { LandingScreen } from './src/screens/LandingScreen';

const DraftScreenWithNav = DraftScreen as React.ComponentType<{ navigateToMatch: () => void }>;

function MainApp() {
  const { session, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<'draft' | 'match' | 'packs' | 'myclub' | 'mysquad'>('draft');
  const [authMode, setAuthMode] = useState<'landing' | 'login' | 'signup'>('landing');

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#1f8cff" />
      </SafeAreaView>
    );
  }

  if (!session) {
    if (authMode === 'landing') {
      return <LandingScreen onNavigateToAuth={(mode) => setAuthMode(mode)} />;
    }
    if (authMode === 'login') {
      return <LoginScreen onNavigateToSignup={() => setAuthMode('signup')} />;
    }
    if (authMode === 'signup') {
      return <SignupScreen onNavigateToLogin={() => setAuthMode('login')} />;
    }
  }

  return (
    <SquadProvider>
      <SafeAreaView style={styles.container}>
        <View style={[styles.tabContent, { display: currentTab === 'draft' ? 'flex' : 'none' }]}>
          <DraftScreenWithNav navigateToMatch={() => setCurrentTab('match')} />
        </View>
        <View style={[styles.tabContent, { display: currentTab === 'match' ? 'flex' : 'none' }]}>
          <MatchScreen isActive={currentTab === 'match'} />
        </View>
        <View style={[styles.tabContent, { display: currentTab === 'packs' ? 'flex' : 'none' }]}>
          <PackScreen isActive={currentTab === 'packs'} />
        </View>
        <View style={[styles.tabContent, { display: currentTab === 'myclub' ? 'flex' : 'none' }]}>
          <MyPlayersScreen />
        </View>
        <View style={[styles.tabContent, { display: currentTab === 'mysquad' ? 'flex' : 'none' }]}>
          <MySquadScreen />
        </View>

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

          <Pressable
            style={({ pressed }) => [styles.tabButton, currentTab === 'mysquad' && styles.tabActive, pressed && styles.tabPressed]}
            onPress={() => setCurrentTab('mysquad')}
          >
            <Text style={[styles.tabText, currentTab === 'mysquad' && styles.tabTextActive]}>My Squad</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </SquadProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <MainApp />
      </ErrorBoundary>
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
  tabContent: {
    flex: 1,
  },
});