import React, { useMemo } from 'react';
import {
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { PlayerCard } from '../components/Card/PlayerCard';
import { useDraft } from '../hooks/useDraft';

const getSlotLabel = (slotIndex: number): string => {
  if (slotIndex === 0) {
    return 'Goalkeeper';
  }
  if (slotIndex >= 1 && slotIndex <= 4) {
    return 'Defender';
  }
  if (slotIndex >= 5 && slotIndex <= 7) {
    return 'Midfielder';
  }
  if (slotIndex >= 8 && slotIndex <= 10) {
    return 'Attacker';
  }
  return 'Substitute';
};

const DraftScreen: React.FC = () => {
  const {
    draftStatus,
    currentSlotIndex,
    currentChoices,
    startingXI,
    bench,
    loading,
    error,
    startDraft,
    selectPlayer,
    restartDraft,
  } = useDraft();

  const isDrafting = draftStatus === 'drafting';
  const isFinished = draftStatus === 'finished';

  const pickCounter = useMemo(() => {
    if (currentSlotIndex < 11) {
      return `${currentSlotIndex + 1}/11`;
    }
    return `${currentSlotIndex - 10}/7`;
  }, [currentSlotIndex]);

  const headerText = useMemo(() => {
    if (isDrafting) {
      return `Pick your ${getSlotLabel(currentSlotIndex)} (${pickCounter})`;
    }
    if (isFinished) {
      return 'Draft Complete';
    }
    return 'Interactive Draft';
  }, [currentSlotIndex, isDrafting, isFinished, pickCounter]);

  const secondaryText = useMemo(() => {
    if (isDrafting) {
      return 'Choose one of five options to continue the draft.';
    }
    if (isFinished) {
      return 'Your final squad is ready. Restart to draft again.';
    }
    return 'Start a new draft and build your 11 + 7 squad one pick at a time.';
  }, [isDrafting, isFinished]);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>MADFUT Draft</Text>
        <Text style={styles.subtitle}>{secondaryText}</Text>
      </View>

      <View style={styles.actionRow}>
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.buttonPressed,
            (loading || isDrafting) && styles.buttonDisabled,
          ]}
          onPress={startDraft}
          disabled={loading || isDrafting}
        >
          <Text style={styles.buttonText}>{isDrafting ? 'Drafting...' : 'Start Draft'}</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.buttonPressed,
            (!isFinished && !isDrafting) && styles.buttonDisabled,
          ]}
          onPress={restartDraft}
          disabled={!isFinished && !isDrafting}
        >
          <Text style={styles.secondaryButtonText}>Restart</Text>
        </Pressable>
      </View>

      <View style={styles.statusHeader}>
        <View>
          <Text style={styles.statusLabel}>{headerText}</Text>
          {isDrafting && <Text style={styles.statusValue}>{pickCounter}</Text>}
        </View>
        <Text style={styles.statusCaption}>{isDrafting ? 'Tap a card to lock in this pick.' : 'Current draft state.'}</Text>
      </View>

      {error ? (
        <View style={styles.statusContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {loading && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>Fetching choices...</Text>
        </View>
      )}

      {isDrafting && !loading ? (
        <View style={styles.draftPane}>
          <FlatList
            data={currentChoices}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.choiceList}
            renderItem={({ item }) => (
              <View style={styles.choiceCardWrapper}>
                <PlayerCard player={item} onPress={() => selectPlayer(item)} />
              </View>
            )}
          />

          <View style={styles.currentBoard}>
            <Text style={styles.sectionTitle}>Starting XI</Text>
            {startingXI.length === 0 ? (
              <Text style={styles.emptyText}>No picks yet. Pick a player to begin.</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickedRow}>
                {startingXI.map((player) => (
                  <View key={player.id.toString()} style={styles.pickedChip}>
                    <Text style={styles.pickedLabel}>{player.position}</Text>
                    <Text style={styles.pickedName} numberOfLines={1}>
                      {player.name}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      ) : null}

      {isFinished ? (
        <ScrollView style={styles.finalPane} contentContainerStyle={styles.finalContent}>
          <Text style={styles.sectionTitle}>Starting XI</Text>
          {startingXI.map((player) => (
            <PlayerCard key={player.id.toString()} player={player} />
          ))}

          <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Bench</Text>
          <View style={styles.benchGrid}>
            {bench.map((player) => (
              <View key={player.id.toString()} style={styles.benchItem}>
                <PlayerCard player={player} />
              </View>
            ))}
          </View>

          <View style={styles.footerButtons}>
            <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]} onPress={restartDraft}>
              <Text style={styles.buttonText}>Clear / Restart</Text>
            </Pressable>
            <Pressable style={[styles.secondaryButton, styles.disabledButton]} disabled>
              <Text style={[styles.secondaryButtonText, styles.disabledButtonText]}>Simulate Match</Text>
            </Pressable>
          </View>
        </ScrollView>
      ) : null}

      {!isDrafting && !isFinished && !loading && !error ? (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>Start the draft to choose your lineup one pick at a time.</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
};

export default DraftScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0b0b0b',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  header: {
    marginBottom: 18,
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 8,
  },
  subtitle: {
    color: '#b3b3b3',
    fontSize: 14,
    lineHeight: 20,
    maxWidth: '90%',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  primaryButton: {
    flex: 1,
    marginRight: 10,
    backgroundColor: '#1f8cff',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#1f1f1f',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.86,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  disabledButton: {
    backgroundColor: '#161616',
  },
  disabledButtonText: {
    color: '#707070',
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
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  statusLabel: {
    color: '#9ca3af',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  statusValue: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  statusCaption: {
    color: '#7c7c7c',
    fontSize: 12,
    maxWidth: '45%',
    textAlign: 'right',
  },
  draftPane: {
    marginBottom: 20,
  },
  choiceList: {
    paddingVertical: 8,
    paddingRight: 8,
  },
  choiceCardWrapper: {
    width: 280,
    marginRight: 14,
  },
  currentBoard: {
    marginTop: 14,
    backgroundColor: '#111111',
    borderRadius: 20,
    padding: 14,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  emptyText: {
    color: '#8b8b8b',
    fontSize: 13,
  },
  pickedRow: {
    flexDirection: 'row',
  },
  pickedChip: {
    backgroundColor: '#181818',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 110,
    marginRight: 10,
  },
  pickedLabel: {
    color: '#7c7c7c',
    fontSize: 11,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  pickedName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  finalPane: {
    marginTop: 8,
  },
  finalContent: {
    paddingBottom: 24,
  },
  sectionSpacing: {
    marginTop: 20,
  },
  benchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  benchItem: {
    width: '48%',
    marginBottom: 12,
  },
  footerButtons: {
    marginTop: 20,
    flexDirection: 'row',
    gap: 12,
  },
  statusContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    paddingHorizontal: 12,
  },
  statusText: {
    color: '#cbd5e1',
    fontSize: 15,
    textAlign: 'center',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 15,
    textAlign: 'center',
  },
});
