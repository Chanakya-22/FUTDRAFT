import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { PlayerCard } from '../components/Card/PlayerCard';
import { usePack } from '../hooks/usePack';

const PackScreen: React.FC = () => {
  const { pulledPlayers, isOpening, error, openPack, discard } = usePack();

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Gold Pack</Text>
        <Text style={styles.subtitle}>Open packs to reveal 5 independent player drops.</Text>
      </View>

      <View style={styles.centerArea}>
        {isOpening ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ffd700" />
            <Text style={styles.loadingText}>Opening pack...</Text>
          </View>
        ) : pulledPlayers.length > 0 ? (
          <FlatList
            data={pulledPlayers}
            horizontal={true}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            renderItem={({ item }) => (
              <View style={styles.cardWrapper}>
                <PlayerCard player={item} selected={false} onPress={() => {}} />
              </View>
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsContainer}
          />
        ) : (
          <Text style={styles.hintText}>Tap "Open Gold Pack" to try your luck.</Text>
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      <View style={styles.controls}>
        <Pressable
          style={({ pressed }) => [
            styles.openButton,
            pressed && styles.buttonPressed,
            isOpening && styles.buttonDisabled,
          ]}
          onPress={openPack}
          disabled={isOpening}
        >
          <Text style={styles.openButtonText}>Open Gold Pack</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.buttonPressed,
            pulledPlayers.length === 0 && styles.buttonDisabled,
          ]}
          onPress={discard}
          disabled={pulledPlayers.length === 0}
        >
          <Text style={styles.secondaryButtonText}>Discard / Next Pack</Text>
        </Pressable>
      </View>
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
  centerArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffd700',
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
  },
  cardsContainer: {
    paddingVertical: 12,
  },
  cardWrapper: {
    width: 300,
    marginRight: 14,
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  openButton: {
    flex: 1,
    backgroundColor: '#1f8cff',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
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
