import React from 'react';
import { ActivityIndicator, StyleSheet, View, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Contexts & Boundaries
import { SquadProvider } from './src/context/SquadContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ErrorBoundary } from './src/components/ErrorBoundary';

// Screens
import { LandingScreen } from './src/screens/LandingScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import DraftScreen from './src/screens/DraftScreen';
import MatchScreen from './src/screens/MatchScreen';
import PackScreen from './src/screens/PackScreen';
import MyPlayersScreen from './src/screens/MyPlayersScreen';
import MySquadScreen from './src/screens/MySquadScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// TypeScript bypasses for screens that require custom props
const DraftScreenWithNav = DraftScreen as React.ComponentType<any>;
const LoginScreenWithNav = LoginScreen as React.ComponentType<any>;
const SignupScreenWithNav = SignupScreen as React.ComponentType<any>;

// --- 1. THE MAIN GAME TABS ---
function MainTabNavigator() {
  return (
    <SquadProvider>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tempTabBar,
          tabBarActiveTintColor: '#fff',
          tabBarInactiveTintColor: '#888',
        }}
      >
        <Tab.Screen name="Draft">
          {(props) => (
            <DraftScreenWithNav 
              {...props} 
              navigateToMatch={() => props.navigation.navigate('Match')} 
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Match" component={MatchScreen} />
        <Tab.Screen name="Packs" component={PackScreen} />
        <Tab.Screen name="MyClub" component={MyPlayersScreen} options={{ title: 'My Club' }} />
        <Tab.Screen name="MySquad" component={MySquadScreen} options={{ title: 'My Squad' }} />
      </Tab.Navigator>
    </SquadProvider>
  );
}

// --- 2. THE ROOT ROUTER (Auth vs Game) ---
function RootNavigator() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1f8cff" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!session ? (
        // User is NOT logged in -> Show Landing/Auth Flow
        <>
          <Stack.Screen name="Landing">
            {(props) => (
              <LandingScreen 
                onNavigateToAuth={(mode) => 
                  props.navigation.navigate(mode === 'login' ? 'Login' : 'Signup')
                } 
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Login">
            {(props) => (
              <LoginScreenWithNav 
                {...props} 
                onNavigateToSignup={() => props.navigation.navigate('Signup')} 
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Signup">
            {(props) => (
              <SignupScreenWithNav 
                {...props} 
                onNavigateToLogin={() => props.navigation.navigate('Login')} 
              />
            )}
          </Stack.Screen>
        </>
      ) : (
        // User IS logged in -> Show Main Game
        <Stack.Screen name="MainApp" component={MainTabNavigator} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <AuthProvider>
        <ErrorBoundary>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </ErrorBoundary>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0d0d0d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tempTabBar: {
    backgroundColor: '#070707',
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    paddingBottom: 5,
    paddingTop: 5,
  }
});