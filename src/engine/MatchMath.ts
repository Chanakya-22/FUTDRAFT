import { Player } from '../types';

export type Mentality = 'attack' | 'balanced' | 'defense';

export interface MatchEvent {
  type: 'goal' | 'save' | 'miss' | 'tackle' | 'neutral';
  text: string;
  team: 'user' | 'cpu' | 'none';
}

const CPU_POSITIONS = ['GK', 'RB', 'CB', 'CB', 'LB', 'RM', 'CM', 'LM', 'RW', 'ST', 'LW'] as const;
const BASE_RATING = 85;

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

const getRatingValue = (player: Player, type: 'attack' | 'defend'): number => {
  if (type === 'attack') {
    return player.pace + player.shooting;
  }
  return player.defending + player.physical;
};

const getMentalityModifiers = (mentality: Mentality) => {
  if (mentality === 'attack') {
    return { attackBias: 0.2, defenseMultiplier: 0.85 };
  }
  if (mentality === 'defense') {
    return { attackBias: -0.2, defenseMultiplier: 1.2 };
  }
  return { attackBias: 0, defenseMultiplier: 1.0 };
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

const rollPercent = () => Math.random() * 100;
const neutralThreshold = () => 75 + Math.random() * 10;

export const evaluateEncounter = (
  mentality: Mentality,
  playerSquad: Player[],
  cpuSquad: Player[],
): MatchEvent => {
  const modifiers = getMentalityModifiers(mentality);

  if (rollPercent() < neutralThreshold()) {
    return {
      type: 'neutral',
      text: 'Possession contested in midfield...',
      team: 'none',
    };
  }

  const isUserAttack = Math.random() < 0.5 + modifiers.attackBias;
  const userAttackers = findPlayersByPositionGroup(playerSquad, attackerPositions as unknown as readonly string[]);
  const cpuAttackers = findPlayersByPositionGroup(cpuSquad, attackerPositions as unknown as readonly string[]);
  const userDefenders = findPlayersByPositionGroup(playerSquad, defenderPositions as unknown as readonly string[]);
  const cpuDefenders = findPlayersByPositionGroup(cpuSquad, defenderPositions as unknown as readonly string[]);

  const attacker = pickRandom(isUserAttack ? userAttackers : cpuAttackers) ?? pickRandom(isUserAttack ? playerSquad : cpuSquad)!;
  const defender = pickRandom(isUserAttack ? cpuDefenders : userDefenders) ?? pickRandom(isUserAttack ? cpuSquad : playerSquad)!;
  const attackPower = getRatingValue(attacker, 'attack');
  const defensePower = getRatingValue(defender, 'defend') * modifiers.defenseMultiplier;
  const dice = Math.random() * 20 - 10;
  const result = attackPower + dice - defensePower;
  const keeperSaved = Math.random() < 0.3;

  if (result >= 8) {
    if (keeperSaved) {
      return {
        type: 'save',
        text: `${attacker.name} beats the defense but the keeper makes an incredible stop.`,
        team: isUserAttack ? 'cpu' : 'user',
      };
    }

    return {
      type: 'goal',
      text: isUserAttack
        ? `${attacker.name} powers through CPU defense and finds the net.`
        : `${attacker.name} breaks the line and scores for CPU.`,
      team: isUserAttack ? 'user' : 'cpu',
    };
  }

  if (result >= 0) {
    return {
      type: 'save',
      text: isUserAttack
        ? `${attacker.name}'s strike is denied by a big CPU block.`
        : `User defense stands tall to deny ${attacker.name}.`,
      team: isUserAttack ? 'cpu' : 'user',
    };
  }

  if (result >= -8) {
    return {
      type: 'miss',
      text: isUserAttack
        ? `${attacker.name} drags the opportunity wide under pressure.`
        : `${attacker.name} skies the chance from distance.`,
      team: isUserAttack ? 'user' : 'cpu',
    };
  }

  return {
    type: 'tackle',
    text: isUserAttack
      ? `${defender.name} snuffs out the attempt with a crunching challenge.`
      : `${defender.name} cuts out the effort and triggers a break.`,
    team: isUserAttack ? 'cpu' : 'user',
  };
};
