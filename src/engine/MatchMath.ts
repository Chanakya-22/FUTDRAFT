import { Player } from '../types';

export type Mentality = 'attack' | 'balanced' | 'defense';

export interface MatchEvent {
  type: 'goal' | 'save' | 'miss' | 'tackle';
  text: string;
  team: 'user' | 'cpu';
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

export const evaluateEncounter = (
  mentality: Mentality,
  playerSquad: Player[],
  cpuSquad: Player[],
): MatchEvent => {
  const modifiers = getMentalityModifiers(mentality);
  const isUserAttack = Math.random() < 0.5 + modifiers.attackBias;

  const userAttackers = findPlayersByPositionGroup(playerSquad, attackerPositions as unknown as readonly string[]);
  const cpuAttackers = findPlayersByPositionGroup(cpuSquad, attackerPositions as unknown as readonly string[]);
  const userDefenders = findPlayersByPositionGroup(playerSquad, defenderPositions as unknown as readonly string[]);
  const cpuDefenders = findPlayersByPositionGroup(cpuSquad, defenderPositions as unknown as readonly string[]);

  if (isUserAttack) {
    const attacker = pickRandom(userAttackers) ?? pickRandom(playerSquad)!;
    const defender = pickRandom(cpuDefenders) ?? pickRandom(cpuSquad)!;
    const attackPower = getRatingValue(attacker, 'attack');
    const defensePower = getRatingValue(defender, 'defend') * modifiers.defenseMultiplier;
    const dice = Math.random() * 20 - 10;
    const result = attackPower + dice - defensePower;

    if (result >= 8) {
      return {
        type: 'goal',
        text: `${attacker.name} powers through CPU defense and finds the net.`,
        team: 'user',
      };
    }
    if (result >= 0) {
      return {
        type: 'save',
        text: `${attacker.name}'s strike is denied by a big CPU block.`,
        team: 'cpu',
      };
    }
    if (result >= -8) {
      return {
        type: 'miss',
        text: `${attacker.name} drags the opportunity wide under pressure.`,
        team: 'user',
      };
    }
    return {
      type: 'tackle',
      text: `${defender.name} snuffs out the attempt with a crunching challenge.`,
      team: 'cpu',
    };
  }

  const attacker = pickRandom(cpuAttackers) ?? pickRandom(cpuSquad)!;
  const defender = pickRandom(userDefenders) ?? pickRandom(playerSquad)!;
  const attackPower = getRatingValue(attacker, 'attack');
  const defensePower = getRatingValue(defender, 'defend') * modifiers.defenseMultiplier;
  const dice = Math.random() * 20 - 10;
  const result = attackPower + dice - defensePower;

  if (result >= 8) {
    return {
      type: 'goal',
      text: `${attacker.name} breaks the line and scores for CPU.`,
      team: 'cpu',
    };
  }
  if (result >= 0) {
    return {
      type: 'save',
      text: `User defense stands tall to deny ${attacker.name}.`,
      team: 'user',
    };
  }
  if (result >= -8) {
    return {
      type: 'miss',
      text: `${attacker.name} skies the chance from distance.`,
      team: 'cpu',
    };
  }
  return {
    type: 'tackle',
    text: `${defender.name} cuts out the effort and triggers a break.`,
    team: 'user',
  };
};
