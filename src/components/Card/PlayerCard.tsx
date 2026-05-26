import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Player } from '../../types';

interface PlayerCardProps {
  player: Player;
  selected?: boolean;
  onPress?: () => void;
}

const statRows = [
  ['pace', 'shooting', 'passing'],
  ['dribbling', 'defending', 'physical'],
] as const;

const labels: Record<string, string> = {
  pace: 'PAC',
  shooting: 'SHO',
  passing: 'PAS',
  dribbling: 'DRI',
  defending: 'DEF',
  physical: 'PHY',
};

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, selected = false, onPress }) => {
  const imageFallback = 'https://via.placeholder.com/400x400?text=No+Image';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.selectedCard,
        pressed && styles.pressedCard,
      ]}
      android_ripple={{ color: '#333' }}
    >
      <View style={styles.topSection}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: player.image_url || imageFallback }}
            style={styles.avatar}
            resizeMode="cover"
          />
        </View>
        <View style={styles.titleColumn}>
          <Text style={styles.name} numberOfLines={1}>
            {player.name}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.metaBadge}>
              <Text style={styles.metaText}>{player.position}</Text>
            </View>
            <Text style={styles.clubText} numberOfLines={1}>
              {player.club}
            </Text>
          </View>
          <Text style={styles.nationText}>{player.nation}</Text>
        </View>
        <View style={styles.ratingBox}>
          <Text style={styles.ratingLabel}>OVR</Text>
          <Text style={styles.ratingValue}>{player.rating}</Text>
        </View>
      </View>

      <View style={styles.statsSection}>
        {statRows.map((row) => (
          <View style={styles.statsRow} key={row.join('-')}>
            {row.map((statKey) => (
              <View style={styles.statCell} key={statKey}>
                <Text style={styles.statLabel}>{labels[statKey]}</Text>
                <Text style={styles.statValue}>{player[statKey]}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#161616',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#1f8cff',
  },
  pressedCard: {
    opacity: 0.92,
  },
  topSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 84,
    height: 108,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#222',
    marginRight: 14,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  titleColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaBadge: {
    backgroundColor: '#272727',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 6,
    marginRight: 8,
  },
  metaText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  clubText: {
    color: '#ddd',
    fontSize: 12,
    marginBottom: 6,
    flexShrink: 1,
  },
  nationText: {
    color: '#aaa',
    fontSize: 12,
  },
  ratingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  ratingLabel: {
    color: '#888',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  ratingValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
  },
  statsSection: {
    borderTopWidth: 1,
    borderTopColor: '#272727',
    paddingTop: 14,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statCell: {
    flex: 1,
    backgroundColor: '#1c1c1c',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statLabel: {
    color: '#7e7e7e',
    fontSize: 11,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
