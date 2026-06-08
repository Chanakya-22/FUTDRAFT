import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { PlayerCard } from '../components/Card/PlayerCard';
import { usePack } from '../hooks/usePack';

interface PackScreenProps {
  isActive?: boolean;
}

const PackScreen: React.FC<PackScreenProps> = ({ isActive = true }) => {
  const { pulledPlayers, isOpening, error, userCoins, fetchBalance, openPack, discard } = usePack();

  // Listen to the custom tab router. Every time isActive becomes true, fetch the live balance!
  useEffect(() => {
    if (isActive) {
      fetchBalance();
    }
  }, [isActive, fetchBalance]);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>STOREFRONT</Text>
          <Text style={styles.subtitle}>Acquire new players for your club.</Text>
        </View>
        <View style={styles.coinHud}>
          <Text style={styles.coinText}>{userCoins} C</Text>
        </View>
      </View>

      <View style={styles.centerArea}>
        {isOpening ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1f8cff" />
            <Text style={styles.loadingText}>Opening pack...</Text>
          </View>
        ) : pulledPlayers.length > 0 ? (
          <FlatList
            data={pulledPlayers}
            numColumns={2}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            renderItem={({ item }) => (
              <View style={styles.gridCardWrapper}>
                <View style={styles.gridCardInner} pointerEvents="none">
                  <PlayerCard player={item} selected={false} onPress={() => {}} />
                </View>
              </View>
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.gridContainer}
            columnWrapperStyle={styles.columnWrapper}
          />
        ) : (
          <ScrollView style={styles.storefront} contentContainerStyle={styles.storefrontContent} showsVerticalScrollIndicator={false}>
            <Pressable 
              style={({ pressed }) => [styles.packButton, pressed && styles.buttonPressed, isOpening && styles.buttonDisabled]}
              onPress={() => openPack('STANDARD')}
              disabled={isOpening}
            >
              <Text style={styles.packTitle}>Standard Pack</Text>
              <Text style={styles.packDesc}>1x 85+ OVR, 10x {'<'}85 OVR</Text>
              <Text style={styles.packPrice}>1000 Coins</Text>
            </Pressable>

            <Pressable 
              style={({ pressed }) => [styles.packButton, pressed && styles.buttonPressed, isOpening && styles.buttonDisabled]}
              onPress={() => openPack('DELUXE')}
              disabled={isOpening}
            >
              <Text style={styles.packTitle}>Deluxe Pack</Text>
              <Text style={styles.packDesc}>1x 88+ OVR, 10x {'<'}85 OVR</Text>
              <Text style={styles.packPrice}>2000 Coins</Text>
            </Pressable>

            <Pressable 
              style={({ pressed }) => [styles.packButton, pressed && styles.buttonPressed, isOpening && styles.buttonDisabled]}
              onPress={() => openPack('ULTRA')}
              disabled={isOpening}
            >
              <Text style={styles.packTitle}>Ultra Deluxe Pack</Text>
              <Text style={styles.packDesc}>1x 90+ OVR, 10x {'<'}85 OVR</Text>
              <Text style={styles.packPrice}>3000 Coins</Text>
            </Pressable>
          </ScrollView>
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      {pulledPlayers.length > 0 && !isOpening && (
        <View style={styles.controls}>
          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
            onPress={discard}
          >
            <Text style={styles.secondaryButtonText}>Discard / Storefront</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
};

export default PackScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0d0d0d',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  header: {
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    color: '#bbb',
    fontSize: 14,
    marginTop: 6,
  },
  coinHud: {
    backgroundColor: '#111',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  coinText: {
    color: '#ffd700',
    fontWeight: '900',
    fontSize: 16,
  },
  centerArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    color: '#1f8cff',
    marginTop: 12,
    fontWeight: '700',
  },
  hintText: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    color: '#ff6b6b',
    marginTop: 12,
    marginBottom: 12,
  },
  storefront: {
    width: '100%',
  },
  storefrontContent: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  packButton: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  packTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  packDesc: {
    color: '#888',
    fontSize: 13,
    marginTop: 6,
  },
  packPrice: {
    color: '#1f8cff',
    fontSize: 15,
    fontWeight: '900',
    marginTop: 12,
  },
  gridContainer: {
    paddingVertical: 12,
  },
  columnWrapper: {
    justifyContent: 'space-evenly',
    marginBottom: 20,
    gap: 15,
  },
  gridCardWrapper: {
    width: 150,
    height: 210,
    overflow: 'visible',
  },
  gridCardInner: {
    width: 250,
    height: 350,
    transform: [{ scale: 0.6 }],
    marginLeft: -50,
    marginTop: -70,
  },
  controls: {
    flexDirection: 'row',
    marginTop: 8,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});