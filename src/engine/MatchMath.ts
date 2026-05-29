import { Player } from '../types';

export type Mentality = 'attack' | 'balanced' | 'defense';

export interface MatchEvent {
  type: 'goal' | 'save' | 'miss' | 'neutral';
  team: 'user' | 'cpu' | 'none';
  message: string;
}

const CPU_POSITIONS = ['GK', 'RB', 'CB', 'CB', 'LB', 'RM', 'CM', 'LM', 'RW', 'ST', 'LW'] as const;
const BASE_RATING = 85;
const AMBIENT_EVENT_CHANCE = 0.05;
const NEUTRAL_THRESHOLD = 0.8;

export const generateCPUTeam = (): Player[] =>
  CPU_POSITIONS.map((position, index) => ({
    id: 3000 + index,
    name: `CPU ${position}`,
    club: 'CPU FC',
    nation: 'CPU',
    position,
    rating: BASE_RATING,
    pace: BASE_RATING,
    shooting: BASE_RATING,
    passing: BASE_RATING,
    dribbling: BASE_RATING,
    defending: BASE_RATING,
    physical: BASE_RATING,
    image_url: '',
  }));

const applyMentalityBoost = (stat: number, mentality: Mentality, statType: 'attack' | 'defend'): number => {
  if (mentality === 'attack' && statType === 'attack') {
    return stat * 1.15;
  }
  if (mentality === 'attack' && statType === 'defend') {
    return stat * 0.9;
  }
  if (mentality === 'defense' && statType === 'defend') {
    return stat * 1.15;
  }
  if (mentality === 'defense' && statType === 'attack') {
    return stat * 0.9;
  }
  return stat;
};

const getRatingValue = (player: Player, type: 'attack' | 'defend', mentality: Mentality): number => {
  if (type === 'attack') {
    return applyMentalityBoost(player.pace + player.shooting, mentality, 'attack');
  }
  return applyMentalityBoost(player.defending + player.physical, mentality, 'defend');
};

const getMentalityModifiers = (mentality: Mentality) => {
  if (mentality === 'attack') {
    return { attackBias: 0.2 };
  }
  if (mentality === 'defense') {
    return { attackBias: -0.2 };
  }
  return { attackBias: 0 };
};

const pickRandom = <T,>(items: T[]): T | null => {
  if (items.length === 0) {
    return null;
  }
  return items[Math.floor(Math.random() * items.length)];
};

const attackerPositions = ['ST', 'LW', 'RW', 'CF', 'CAM', 'CM', 'RM', 'LM'] as const;
const defenderPositions = ['GK', 'CB', 'LB', 'RB', 'LWB', 'RWB', 'CDM'] as const;

const findPlayersByPositionGroup = (players: Player[], positions: readonly string[]) =>
  players.filter((player) => positions.includes(player.position));

export const evaluateEncounter = (
  mentality: Mentality,
  playerSquad: Player[],
  cpuSquad: Player[],
): MatchEvent => {
  if (Math.random() < NEUTRAL_THRESHOLD) {
    return {
      type: 'neutral',
      team: 'none',
      message: 'Possession contested in midfield...',
    };
  }

  if (Math.random() < AMBIENT_EVENT_CHANCE) {
    const isUserGoal = Math.random() < 0.5;
    return {
      type: 'goal',
      team: isUserGoal ? 'user' : 'cpu',
      message: isUserGoal
        ? 'Unexpected turnaround! User breaks through with a stunning finish.'
        : 'CPU capitalizes on a rare opportunity with a clinical strike.',
    };
  }

  const modifiers = getMentalityModifiers(mentality);
  const isUserAttack = Math.random() < 0.5 + modifiers.attackBias;

  const userAttackers = findPlayersByPositionGroup(playerSquad, attackerPositions as unknown as readonly string[]);
  const cpuAttackers = findPlayersByPositionGroup(cpuSquad, attackerPositions as unknown as readonly string[]);
  const userDefenders = findPlayersByPositionGroup(playerSquad, defenderPositions as unknown as readonly string[]);
  const cpuDefenders = findPlayersByPositionGroup(cpuSquad, defenderPositions as unknown as readonly string[]);

  const attacker = pickRandom(isUserAttack ? userAttackers : cpuAttackers) ?? pickRandom(isUserAttack ? playerSquad : cpuSquad)!;
  const defender = pickRandom(isUserAttack ? cpuDefenders : userDefenders) ?? pickRandom(isUserAttack ? cpuSquad : playerSquad)!;

  const userMentality = isUserAttack ? mentality : 'balanced';
  const cpuMentality = isUserAttack ? 'balanced' : mentality;

  const attackPower = getRatingValue(attacker, 'attack', userMentality);
  const defensePower = getRatingValue(defender, 'defend', cpuMentality);
  const variance = (Math.random() - 0.5) * 10;
  const result = attackPower - defensePower + variance;

  if (result >= 12) {
    return {
      type: 'goal',
      team: isUserAttack ? 'user' : 'cpu',
      message: isUserAttack
        ? `${attacker.name} finds the net with composure.`
        : `${attacker.name} slots one past the keeper for CPU.`,
    };
  }

  if (result >= 0) {
    return {
      type: 'save',
      team: isUserAttack ? 'cpu' : 'user',
      message: isUserAttack
        ? `${attacker.name} goes close, but ${defender.name} blocks the chance.`
        : `${defender.name} denies ${attacker.name} with a solid block.`,
    };
  }

  if (result >= -12) {
    return {
      type: 'miss',
      team: isUserAttack ? 'user' : 'cpu',
      message: isUserAttack
        ? `${attacker.name} strikes wide under pressure.`
        : `${attacker.name} fires high and wide.`,
    };
  }

  return {
    type: 'save',
    team: isUserAttack ? 'cpu' : 'user',
    message: isUserAttack
      ? `${defender.name} makes a crucial interception.`
      : `${defender.name} snuffs out the threat.`,
  };
};
