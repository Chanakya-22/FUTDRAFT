import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
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
import { calculateTeamOVR } from '../engine/MatchMath';
import { Player } from '../types';
import { useSquad } from '../context/SquadContext';

const mentalityOptions: Array<{ label: string; value: 'attack' | 'balanced' | 'defense' }> = [
  { label: 'Attack', value: 'attack' },
  { label: 'Balanced', value: 'balanced' },
  { label: 'Defense', value: 'defense' },
];

interface MatchScreenProps {
  isActive?: boolean;
}

const MatchScreen: React.FC<MatchScreenProps> = ({ isActive = true }) => {
  const { startingXI, bench, clearSquad } = useSquad();
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
    penaltyTurn,
    penaltyRound,
    penaltyShootout,
    userPenaltyLog,
    cpuPenaltyLog,
    cpuTeam,
    cpuLoading,
    subModalOpen,
    setMentality,
    togglePause,
    openSubModal,
    closeSubModal,
    performSub,
    resumeSecondHalf,
    shootPenalty,
    pauseMatch,
    resetMatch,
    coinsEarned,
    matchResult,
  } = useMatchSim(startingXI, bench);
  const [squadModalOpen, setSquadModalOpen] = useState(false);
  const [selectedPitchId, setSelectedPitchId] = useState<number | null>(null);
  const [selectedBenchId, setSelectedBenchId] = useState<number | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);

  const userOVR = useMemo(() => calculateTeamOVR(activePitch), [activePitch]);
  const cpuOVR = useMemo(() => calculateTeamOVR(cpuTeam), [cpuTeam]);

  useEffect(() => {
    if (!isActive && !isPaused && matchPhase === 'live') {
      pauseMatch();
    }
  }, [isActive, isPaused, matchPhase, pauseMatch]);

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

  // NEW: Exit sequence to clean up the engine AND wipe the draft
  const handleExitMatch = () => {
    resetMatch();
    if (clearSquad) clearSquad();
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

  if (cpuLoading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>Loading CPU squad...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (matchPhase === 'penalties' && penaltyTurn) {
    const directionLabel = penaltyTurn === 'user_shoot' ? 'Choose a direction to shoot' : 'YOU ARE THE GOALKEEPER';
    const rowLabel = penaltyTurn === 'user_shoot' ? 'Your shot' : 'Your save';

    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.penaltyHeader}>
          <Text style={styles.penaltyTitle}>PENALTY SHOOTOUT</Text>
          <Text style={styles.penaltyScore}>
            {penaltyShootout.user} - {penaltyShootout.cpu}
          </Text>
          <Text style={styles.penaltyRound}>Round {penaltyRound}</Text>
        </View>

        <View style={styles.penaltyTrackWrapper}>
          <View style={styles.penaltyTrackRow}>
            <Text style={styles.penaltyTrackLabel}>USER</Text>
            {userPenaltyLog.map((status, index) => (
              <View key={`user-${index}`} style={[
                styles.penaltyDot,
                status === 'goal' && styles.penaltyDotGoal,
                status === 'miss' && styles.penaltyDotMiss,
                status === 'pending' && styles.penaltyDotPending,
              ]}
              />
            ))}
          </View>
          <View style={styles.penaltyTrackRow}>
            <Text style={styles.penaltyTrackLabel}>CPU</Text>
            {cpuPenaltyLog.map((status, index) => (
              <View key={`cpu-${index}`} style={[
                styles.penaltyDot,
                status === 'goal' && styles.penaltyDotGoal,
                status === 'miss' && styles.penaltyDotMiss,
                status === 'pending' && styles.penaltyDotPending,
              ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.penaltyInstructions}>
          <Text style={styles.instructionText}>{directionLabel}</Text>
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
          <Text style={styles.penaltyEventsTitle}>{rowLabel} Log</Text>
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
          <Text style={styles.ovrBadge}>{userOVR} OVR</Text>
          <Text style={styles.scoreValue}>{score.user}</Text>
        </View>
        <View style={styles.clockContainer}>
          <Text style={styles.clockText}>{formattedClock}</Text>
        </View>
        <View style={styles.scoreColumn}>
          <Text style={styles.scoreLabel}>CPU</Text>
          <Text style={styles.ovrBadge}>{cpuOVR} OVR</Text>
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

      {/* Conditionally Render: Rewards Box at Full Time, Controls during Live Match */}
      {matchPhase === 'fulltime' ? (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>
            {matchResult === 'WIN' ? 'MATCH VICTORIOUS' : matchResult === 'DRAW' ? 'MATCH DRAWN' : 'MATCH DEFEATED'}
          </Text>
          <Text style={styles.summaryCoins}>🪙 +{coinsEarned} Coins Deposited</Text>
          
          <Pressable
            style={({ pressed }) => [styles.exitMatchButton, pressed && styles.buttonPressed]}
            onPress={handleExitMatch}
          >
            <Text style={styles.exitMatchButtonText}>Claim & Return to Hub</Text>
          </Pressable>
        </View>
      ) : (
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
              onPress={() => {
                setSelectedPitchId(null);
                setSelectedBenchId(null);
                openSubModal();
              }}
              disabled={subsRemaining <= 0 || matchPhase !== 'live'}
            >
              <Text style={styles.actionButtonText}>Sub ({subsRemaining})</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.actionButton, pressed && styles.buttonPressed]}
              onPress={() => setSquadModalOpen(true)}
            >
              <Text style={styles.actionButtonText}>View Squads</Text>
            </Pressable>
          </View>

          {(isPaused || matchPhase !== 'live') && (
            <Pressable
              style={({ pressed }) => [styles.actionButton, styles.resetButton, pressed && styles.buttonPressed]}
              onPress={resetMatch}
            >
              <Text style={styles.actionButtonText}>Reset Match</Text>
            </Pressable>
          )}
        </View>
      )}

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

      <Modal visible={squadModalOpen} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.cpuModalContent}>
            <Text style={styles.modalTitle}>Match Squads</Text>
            <Text style={styles.modalSubtitle}>Review the live match lineup and opponent squad.</Text>

            <Text style={styles.subSectionTitle}>On Pitch</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardRow} contentContainerStyle={{ paddingVertical: 8 }}>
              {activePitch.map((player) => (
                <View key={`my-pitch-${player.id}`} style={styles.cpuCardWrapper}>
                  <PlayerCard player={player} selected={false} />
                </View>
              ))}
            </ScrollView>

            <Text style={styles.subSectionTitle}>Substitutes</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardRow} contentContainerStyle={{ paddingVertical: 8 }}>
              {activeBench.map((player) => (
                <View key={`my-bench-${player.id}`} style={styles.cpuCardWrapper}>
                  <PlayerCard player={player} selected={false} />
                </View>
              ))}
            </ScrollView>

            <Text style={styles.subSectionTitle}>Opponent Squad</Text>
            <ScrollView style={styles.cpuModalList} contentContainerStyle={{ paddingBottom: 8 }}>
              {cpuTeam.map((player) => (
                <View key={player.id.toString()} style={styles.cpuCardWrapper}>
                  <PlayerCard player={player} selected={false} />
                </View>
              ))}
            </ScrollView>

            <Pressable
              style={({ pressed }) => [styles.confirmButton, pressed && styles.buttonPressed]}
              onPress={() => setSquadModalOpen(false)}
            >
              <Text style={styles.confirmButtonText}>Close</Text>
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
                onPress={() => {
                  setSelectedPitchId(null);
                  setSelectedBenchId(null);
                  closeSubModal();
                }}
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
    marginBottom: 12,
  },
  mentalityButton: {
    flex: 1,
    marginHorizontal: 4,
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
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  actionButton: {
    flex: 1,
    minWidth: 110,
    marginBottom: 10,
    backgroundColor: '#1f8cff',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1f8cff',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cpuModalContent: {
    backgroundColor: '#0f0f0f',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    maxHeight: '85%',
  },
  cpuModalList: {
    maxHeight: 230,
    marginBottom: 16,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
    padding: 16,
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
  penaltyTrackWrapper: {
    marginBottom: 20,
    padding: 14,
    backgroundColor: '#121212',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1f1f1f',
  },
  penaltyTrackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  penaltyTrackLabel: {
    color: '#b3b3b3',
    fontSize: 12,
    fontWeight: '700',
    width: 52,
  },
  penaltyDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: '#303030',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  penaltyDotGoal: {
    backgroundColor: '#1f8cff',
    borderColor: '#1f8cff',
  },
  penaltyDotMiss: {
    backgroundColor: '#d32f2f',
    borderColor: '#d32f2f',
  },
  penaltyDotPending: {
    backgroundColor: '#303030',
    borderColor: '#2a2a2a',
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
  ovrBadge: {
    marginTop: 4,
    backgroundColor: '#1a1a1a',
    color: '#b3b3b3',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#262626',
  },
  cpuCardWrapper: {
    marginBottom: 10,
  },
  resetButton: {
    marginTop: 8,
    backgroundColor: '#d32f2f',
    borderColor: '#b71c1c',
  },
  summaryCard: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ffd700',
    alignItems: 'center',
  },
  summaryTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  summaryCoins: {
    color: '#ffd700',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 16,
  },
  exitMatchButton: {
    backgroundColor: '#1f8cff',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginTop: 12,
  },
  exitMatchButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
});