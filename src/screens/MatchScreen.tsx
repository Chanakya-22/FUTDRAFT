import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { PlayerCard } from '../components/Card/PlayerCard';
import { useMatchSim } from '../hooks/useMatchSim';
import { useSquad } from '../context/SquadContext';
import { Player } from '../types';

const mentalityOptions: Array<{ label: string; value: 'attack' | 'balanced' | 'defense' }> = [
  { label: 'Attack', value: 'attack' },
  { label: 'Balanced', value: 'balanced' },
  { label: 'Defense', value: 'defense' },
];

const MatchScreen: React.FC = () => {
  const { startingXI, bench } = useSquad();
  const {
    clock,
    score,
    events,
    mentality,
    subsRemaining,
    isPaused,
    activePitch,
    activeBench,
    cpuTeam,
    subModalOpen,
    setMentality,
    togglePause,
    openSubModal,
    closeSubModal,
    performSub,
  } = useMatchSim(startingXI, bench);

  const [selectedPitchId, setSelectedPitchId] = useState<number | null>(null);
  const [selectedBenchId, setSelectedBenchId] = useState<number | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollToEnd({ animated: true });
    }
  }, [events]);

  const formattedClock = useMemo(() => `${clock}'`, [clock]);

  const handleConfirmSub = () => {
    if (selectedPitchId !== null && selectedBenchId !== null) {
      performSub(selectedPitchId, selectedBenchId);
      setSelectedPitchId(null);
      setSelectedBenchId(null);
      closeSubModal();
    }
  };

  if (startingXI.length === 0) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>Draft a squad first to start the match simulation.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.scoreBox}>
        <View style={styles.scoreColumn}>
          <Text style={styles.scoreLabel}>USER</Text>
          <Text style={styles.scoreValue}>{score.user}</Text>
        </View>
        <View style={styles.clockContainer}>
          <Text style={styles.clockText}>{formattedClock}</Text>
          <Text style={styles.clockLabel}>Match Time</Text>
        </View>
        <View style={styles.scoreColumn}>
          <Text style={styles.scoreLabel}>CPU</Text>
          <Text style={styles.scoreValue}>{score.cpu}</Text>
        </View>
      </View>

      <View style={styles.tickerSection}>
        <Text style={styles.sectionTitle}>Play-by-play</Text>
        <ScrollView ref={scrollRef} style={styles.tickerBox} contentContainerStyle={styles.tickerContent}>
          {events.map((eventText, index) => (
            <Text key={`${eventText}-${index}`} style={styles.eventText}>
              {eventText}
            </Text>
          ))}
        </ScrollView>
      </View>

      <View style={styles.tacticsBox}>
        <Text style={styles.sectionTitle}>Tactics</Text>
        <View style={styles.mentalityRow}>
          {mentalityOptions.map((option) => (
            <Pressable
              key={option.value}
              style={({ pressed }) => [
                styles.mentalityButton,
                mentality === option.value && styles.mentalityActive,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => setMentality(option.value)}
            >
              <Text style={styles.mentalityText}>{option.label}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={openSubModal}
          disabled={subsRemaining <= 0}
        >
          <Text style={styles.buttonText}>Pause & Make Sub ({subsRemaining} left)</Text>
        </Pressable>
      </View>

      <Modal visible={subModalOpen} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Substitution</Text>
            <Text style={styles.modalSubtitle}>Select a pitch player and a bench player to swap.</Text>

            <Text style={styles.subSectionTitle}>On Pitch</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardRow}>
              {activePitch.map((player) => (
                <Pressable
                  key={player.id.toString()}
                  onPress={() => setSelectedPitchId((current) => (current === player.id ? null : player.id))}
                  style={({ pressed }) => [
                    styles.swapCard,
                    selectedPitchId === player.id && styles.swapCardActive,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <PlayerCard player={player} selected={selectedPitchId === player.id} />
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.subSectionTitle}>Bench</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardRow}>
              {activeBench.map((player) => (
                <Pressable
                  key={player.id.toString()}
                  onPress={() => setSelectedBenchId((current) => (current === player.id ? null : player.id))}
                  style={({ pressed }) => [
                    styles.swapCard,
                    selectedBenchId === player.id && styles.swapCardActive,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <PlayerCard player={player} selected={selectedBenchId === player.id} />
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.modalButtonRow}>
              <Pressable
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
                onPress={closeSubModal}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.buttonPressed,
                  !(selectedPitchId !== null && selectedBenchId !== null) && styles.buttonDisabled,
                ]}
                onPress={handleConfirmSub}
                disabled={!(selectedPitchId !== null && selectedBenchId !== null)}
              >
                <Text style={styles.buttonText}>Confirm</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default MatchScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#070707',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  scoreBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#111111',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  scoreColumn: {
    alignItems: 'center',
  },
  scoreLabel: {
    color: '#8a8a8a',
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  scoreValue: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '900',
  },
  clockContainer: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#161616',
    borderRadius: 16,
  },
  clockText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  clockLabel: {
    color: '#8a8a8a',
    fontSize: 12,
    marginTop: 4,
  },
  tickerSection: {
    flex: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 10,
  },
  tickerBox: {
    backgroundColor: '#101010',
    borderRadius: 18,
    padding: 14,
  },
  tickerContent: {
    paddingBottom: 18,
  },
  eventText: {
    color: '#d9d9d9',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 10,
  },
  tacticsBox: {
    backgroundColor: '#111111',
    borderRadius: 18,
    padding: 16,
  },
  mentalityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  mentalityButton: {
    flex: 1,
    backgroundColor: '#181818',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
  },
  mentalityActive: {
    backgroundColor: '#1f8cff',
  },
  mentalityText: {
    color: '#fff',
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: '#1f8cff',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#1d1d1d',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
  secondaryButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.88,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#0f0f0f',
    borderRadius: 24,
    padding: 18,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 10,
  },
  modalSubtitle: {
    color: '#b3b3b3',
    marginBottom: 16,
  },
  subSectionTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    marginVertical: 12,
  },
  cardRow: {
    marginBottom: 12,
  },
  swapCard: {
    marginRight: 12,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  swapCardActive: {
    borderColor: '#1f8cff',
  },
  modalButtonRow: {
    flexDirection: 'row',
    marginTop: 16,
  },
  statusContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
});
