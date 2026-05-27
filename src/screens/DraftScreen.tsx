import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { PlayerCard } from '../components/Card/PlayerCard';
import { useDraft } from '../hooks/useDraft';

const DraftScreen: React.FC = () => {
  const {
    squad,
    selectedIds,
    selectedSquad,
    loading,
    error,
    generateDraft,
    toggleSelection,
    clearSelection,
  } = useDraft();

  const selectedCount = selectedIds.length;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Draft Squad</Text>
        <Text style={styles.subtitle}>Pick the best players and lock in your starting 11.</Text>
      </View>

      <View style={styles.controlSection}>
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.buttonPressed,
            loading && styles.buttonDisabled,
          ]}
          onPress={generateDraft}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Draft New Squad</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.buttonPressed,
            selectedCount === 0 && styles.buttonDisabled,
          ]}
          onPress={clearSelection}
          disabled={selectedCount === 0}
        >
          <Text style={styles.secondaryButtonText}>Clear</Text>
        </Pressable>
      </View>

      <View style={styles.statusHeader}>
        <View>
          <Text style={styles.statusLabel}>Selected Squad</Text>
          <Text style={styles.statusValue}>{selectedCount}/11</Text>
        </View>

        <Text style={styles.statusCaption}>Tap a card to lock or unlock players.</Text>
      </View>

      {selectedCount > 0 && (
        <View style={styles.selectedChips}>
          {selectedSquad.map((player) => (
            <View key={player.id} style={styles.chip}>
              <Text style={styles.chipText}>{player.name}</Text>
            </View>
          ))}
        </View>
      )}

      {loading ? (
        <View style={styles.statusContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.statusText}>Building your squad...</Text>
        </View>
      ) : error ? (
        <View style={styles.statusContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : squad.length === 0 ? (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>Tap draft to start your squad.</Text>
        </View>
      ) : (
        <FlatList
          data={squad}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <PlayerCard
              player={item}
              selected={selectedIds.includes(item.id)}
              onPress={() => toggleSelection(item.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

export default DraftScreen;

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
    lineHeight: 20,
    marginTop: 6,
  },
  controlSection: {
    backgroundColor: '#131313',
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
    padding: 16,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#1f8cff',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.88,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  statusLabel: {
    color: '#bbb',
    fontSize: 14,
  },
  statusValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  statusCaption: {
    color: '#999',
    fontSize: 12,
  },
  selectedChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  chip: {
    backgroundColor: '#1f1f1f',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  chipText: {
    color: '#fff',
    fontSize: 12,
  },
  statusContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  statusText: {
    color: '#ccc',
    fontSize: 16,
    marginTop: 14,
    textAlign: 'center',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 24,
  },
});
