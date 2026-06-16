import React from 'react';
import { ActivityIndicator, StyleSheet, View, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';

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

// TypeScript bypasses
const DraftScreenWithNav = DraftScreen as React.ComponentType<any>;
const LoginScreenWithNav = LoginScreen as React.ComponentType<any>;
const SignupScreenWithNav = SignupScreen as React.ComponentType<any>;

// --- 1. THE PREMIUM MAIN GAME TABS ---
function MainTabNavigator() {
  return (
    <SquadProvider>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          // 1. Make the tab bar float above the content
          tabBarStyle: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            elevation: 0,
            backgroundColor: 'transparent',
            borderTopWidth: 1,
            borderTopColor: 'rgba(255, 255, 255, 0.08)',
            height: 85,
            paddingBottom: 20, // Lift icons slightly for modern phones
          },
          // 2. Insert the Frosted Glass behind the icons
          tabBarBackground: () => (
            <BlurView tint="dark" intensity={85} style={StyleSheet.absoluteFill} />
          ),
          // 3. Premium Color Palette
          tabBarActiveTintColor: '#1f8cff', // Electric Blue
          tabBarInactiveTintColor: '#8A99AD', // Slate Grey
          tabBarLabelStyle: {
            fontWeight: '700',
            fontSize: 11,
          }
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

// --- 2. THE ROOT ROUTER ---
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
        <Stack.Screen name="MainApp" component={MainTabNavigator} />
      )}
    </Stack.Navigator>
  );
}

// Apply a globally dark theme to React Navigation so screen transitions are black, not white.
const DarkTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#040609', // Deepest background black
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <AuthProvider>
        <ErrorBoundary>
          <NavigationContainer theme={DarkTheme}>
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
    backgroundColor: '#040609',
    justifyContent: 'center',
    alignItems: 'center',
  },
});