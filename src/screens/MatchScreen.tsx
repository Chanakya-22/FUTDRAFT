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
    isPaused,
    isHalfTime,
    matchPhase,
    subsRemaining,
    activePitch,
    activeBench,
    penaltyPhase,
    penaltyRound,
    penaltyShootout,
    subModalOpen,
    setMentality,
    togglePause,
    openSubModal,
    closeSubModal,
    performSub,
    resumeSecondHalf,
    shootPenalty,
  } = useMatchSim(startingXI, bench);

  const [selectedPitchId, setSelectedPitchId] = useState<number | null>(null);
  const [selectedBenchId, setSelectedBenchId] = useState<number | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollToEnd({ animated: true });
    }
  }, [events]);

  const formattedClock = useMemo(() => {
    if (isHalfTime) return 'HT';
    if (matchPhase === 'fulltime') return 'FT';
    if (matchPhase === 'penalties') return 'P';
    return `${clock}'`;
  }, [clock, isHalfTime, matchPhase]);

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
          <Text style={styles.statusText}>No squad found. Please complete the draft first.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (matchPhase === 'penalties' && penaltyPhase === 'shooting') {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.penaltyHeader}>
          <Text style={styles.penaltyTitle}>PENALTY SHOOTOUT</Text>
          <Text style={styles.penaltyScore}>
            {penaltyShootout.user} - {penaltyShootout.cpu}
          </Text>
          <Text style={styles.penaltyRound}>Round {penaltyRound}</Text>
        </View>

        <View style={styles.penaltyInstructions}>
          <Text style={styles.instructionText}>Choose your direction</Text>
        </View>

        <View style={styles.penaltyButtonRow}>
          <Pressable
            style={({ pressed }) => [styles.penaltyButton, pressed && styles.buttonPressed]}
            onPress={() => shootPenalty('LEFT')}
          >
            <Text style={styles.penaltyButtonText}>LEFT</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.penaltyButton, pressed && styles.buttonPressed]}
            onPress={() => shootPenalty('MIDDLE')}
          >
            <Text style={styles.penaltyButtonText}>MIDDLE</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.penaltyButton, pressed && styles.buttonPressed]}
            onPress={() => shootPenalty('RIGHT')}
          >
            <Text style={styles.penaltyButtonText}>RIGHT</Text>
          </Pressable>
        </View>

        <View style={styles.penaltyEvents}>
          <Text style={styles.penaltyEventsTitle}>Shootout Log</Text>
          <ScrollView style={styles.penaltyEventsList} ref={scrollRef} contentContainerStyle={{ paddingBottom: 12 }}>
            {events
              .filter((e) => e.includes('Round') || e.includes('Shootout'))
              .map((eventText, index) => (
                <Text key={`${eventText}-${index}`} style={styles.penaltyEventText}>
                  {eventText}
                </Text>
              ))}
          </ScrollView>
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
        </View>
        <View style={styles.scoreColumn}>
          <Text style={styles.scoreLabel}>CPU</Text>
          <Text style={styles.scoreValue}>{score.cpu}</Text>
        </View>
      </View>

      <View style={styles.tickerSection}>
        <Text style={styles.sectionTitle}>Match Events</Text>
        <ScrollView ref={scrollRef} style={styles.tickerBox} contentContainerStyle={styles.tickerContent}>
          {events.map((eventText, index) => (
            <Text key={`${eventText}-${index}`} style={styles.eventText}>
              {eventText}
            </Text>
          ))}
        </ScrollView>
      </View>

      <View style={styles.controlsBox}>
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

        <View style={styles.actionRow}>
          <Pressable
            style={({ pressed }) => [styles.actionButton, pressed && styles.buttonPressed]}
            onPress={togglePause}
            disabled={matchPhase !== 'live'}
          >
            <Text style={styles.actionButtonText}>{isPaused ? 'Resume' : 'Pause'}</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              subsRemaining <= 0 && styles.buttonDisabled,
              pressed && styles.buttonPressed,
            ]}
            onPress={openSubModal}
            disabled={subsRemaining <= 0 || matchPhase !== 'live'}
          >
            <Text style={styles.actionButtonText}>Sub ({subsRemaining})</Text>
          </Pressable>
        </View>
      </View>

      <Modal visible={isHalfTime} transparent animationType="fade">
        <View style={styles.halftimeOverlay}>
          <View style={styles.halftimeContent}>
            <Text style={styles.halftimeTitle}>HALFTIME</Text>
            <Text style={styles.halftimeScore}>
              {score.user} - {score.cpu}
            </Text>
            <Pressable
              style={({ pressed }) => [styles.resumeButton, pressed && styles.buttonPressed]}
              onPress={resumeSecondHalf}
            >
              <Text style={styles.resumeButtonText}>Resume Match</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

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
                style={({ pressed }) => [styles.cancelButton, pressed && styles.buttonPressed]}
                onPress={closeSubModal}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.confirmButton,
                  pressed && styles.buttonPressed,
                  !(selectedPitchId !== null && selectedBenchId !== null) && styles.buttonDisabled,
                ]}
                onPress={handleConfirmSub}
                disabled={!(selectedPitchId !== null && selectedBenchId !== null)}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
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
    paddingVertical: 16,
  },
  scoreBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1f1f1f',
  },
  scoreColumn: {
    alignItems: 'center',
  },
  scoreLabel: {
    color: '#8a8a8a',
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: 6,
  },
  scoreValue: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '900',
  },
  clockContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  clockText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  tickerSection: {
    flex: 1,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  tickerBox: {
    backgroundColor: '#0f0f0f',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  tickerContent: {
    paddingBottom: 12,
  },
  eventText: {
    color: '#d0d0d0',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  controlsBox: {
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1f1f1f',
  },
  mentalityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
  },
  mentalityButton: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  mentalityActive: {
    backgroundColor: '#1f8cff',
    borderColor: '#1f8cff',
  },
  mentalityText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#1f8cff',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1f8cff',
  },
  actionButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.45,
    backgroundColor: '#444444',
  },
  halftimeOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  halftimeContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  halftimeTitle: {
    color: '#ffffff',
    fontSize: 56,
    fontWeight: '900',
    marginBottom: 20,
    letterSpacing: 4,
  },
  halftimeScore: {
    color: '#ffffff',
    fontSize: 48,
    fontWeight: '800',
    marginBottom: 32,
  },
  resumeButton: {
    backgroundColor: '#1f8cff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderWidth: 2,
    borderColor: '#1f8cff',
  },
  resumeButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
  },
  penaltyHeader: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#1a1a1a',
  },
  penaltyTitle: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 12,
  },
  penaltyScore: {
    color: '#1f8cff',
    fontSize: 40,
    fontWeight: '900',
    marginBottom: 8,
  },
  penaltyRound: {
    color: '#8a8a8a',
    fontSize: 14,
    fontWeight: '700',
  },
  penaltyInstructions: {
    alignItems: 'center',
    marginBottom: 20,
  },
  instructionText: {
    color: '#d0d0d0',
    fontSize: 14,
    fontWeight: '700',
  },
  penaltyButtonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  penaltyButton: {
    backgroundColor: '#1f8cff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderWidth: 2,
    borderColor: '#1f8cff',
  },
  penaltyButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
  penaltyEvents: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  penaltyEventsTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
  },
  penaltyEventsList: {
    flex: 1,
  },
  penaltyEventText: {
    color: '#d0d0d0',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  statusContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#0f0f0f',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1f1f1f',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 8,
  },
  modalSubtitle: {
    color: '#b3b3b3',
    fontSize: 12,
    marginBottom: 16,
  },
  subSectionTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    marginVertical: 10,
  },
  cardRow: {
    marginBottom: 12,
  },
  swapCard: {
    marginRight: 10,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  swapCardActive: {
    borderColor: '#1f8cff',
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#1f8cff',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1f8cff',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
});