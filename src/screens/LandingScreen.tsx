import React from 'react';
import { View, Text, StyleSheet, Pressable, ImageBackground, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface LandingScreenProps {
  onNavigateToAuth: (mode: 'login' | 'signup') => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onNavigateToAuth }) => {
  return (
    <View style={styles.container}>
      <ImageBackground
        // A moody, high-contrast stadium or abstract dark texture works best here
        source={{ uri: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1000' }} 
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Deep Gradient Overlay for that modern, dark-mode fade */}
        <LinearGradient
          colors={['rgba(7, 10, 15, 0.4)', 'rgba(7, 10, 15, 0.95)', '#040609']}
          style={styles.gradientOverlay}
        >
          
          {/* Hero Section */}
          <View style={styles.heroContainer}>
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>SEASON 1</Text>
            </View>
            <Text style={styles.logoText}>FUT<Text style={styles.logoAccent}>DRAFT</Text></Text>
            <Text style={styles.subtitleText}>The Ultimate Tactical Simulation</Text>
          </View>

          {/* Frosted Glass Control Panel */}
          <BlurView intensity={30} tint="dark" style={styles.glassPanel}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.01)']}
              style={styles.glassInner}
            >
              <Text style={styles.welcomeText}>Build Your Legacy.</Text>
              
              <Pressable onPress={() => onNavigateToAuth('login')} style={styles.buttonWrapper}>
                <LinearGradient
                  colors={['#1f8cff', '#005bb5']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.primaryButton}
                >
                  <Text style={styles.primaryButtonText}>Sign In</Text>
                </LinearGradient>
              </Pressable>

              <Pressable onPress={() => onNavigateToAuth('signup')} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Create Club Profile</Text>
              </Pressable>
            </LinearGradient>
          </BlurView>

        </LinearGradient>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundImage: {
    flex: 1,
    width: width,
    height: height,
  },
  gradientOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: height * 0.08,
    paddingHorizontal: 24,
  },
  heroContainer: {
    alignItems: 'center',
    marginTop: height * 0.1,
  },
  badgeContainer: {
    backgroundColor: 'rgba(31, 140, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(31, 140, 255, 0.4)',
    marginBottom: 16,
  },
  badgeText: {
    color: '#1f8cff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
  },
  logoText: {
    fontSize: 62,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  logoAccent: {
    color: '#1f8cff',
  },
  subtitleText: {
    color: '#8A99AD',
    fontSize: 15,
    fontWeight: '500',
    marginTop: 8,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  glassPanel: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 20,
  },
  glassInner: {
    padding: 32,
    alignItems: 'center',
  },
  welcomeText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 28,
  },
  buttonWrapper: {
    width: '100%',
    shadowColor: '#1f8cff',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  secondaryButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  secondaryButtonText: {
    color: '#A0ABC0',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});