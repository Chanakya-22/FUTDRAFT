import { Player } from '../types';

export type Mentality = 'attack' | 'balanced' | 'defense';

export interface MatchEvent {
  type: 'goal' | 'save' | 'miss' | 'neutral';
  team: 'user' | 'cpu' | 'none';
  message: string;
}

const CPU_POSITIONS = ['GK', 'RB', 'CB', 'CB', 'LB', 'RM', 'CM', 'LM', 'RW', 'ST', 'LW'] as const;
const MIN_CPU_STAT = 75;
const MAX_CPU_STAT = 95;
const NEUTRAL_THRESHOLD = 0.72;
const AMBIENT_EVENT_CHANCE = 0.05;

const randomBetween = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const calculatePlayerOVR = (player: Player): number => {
  const p = player?.name ? player : (player as any)?.player_data;
  const pace = p?.pace ?? 50;
  const shooting = p?.shooting ?? 50;
  const passing = p?.passing ?? 50;
  const dribbling = p?.dribbling ?? 50;
  const defending = p?.defending ?? 50;
  const physical = p?.physical ?? 50;
  return Math.round((pace + shooting + passing + dribbling + defending + physical) / 6);
};

export const generateCPUTeam = (): Player[] =>
  CPU_POSITIONS.map((position, index) => {
    const pace = randomBetween(MIN_CPU_STAT, MAX_CPU_STAT);
    const shooting = randomBetween(MIN_CPU_STAT, MAX_CPU_STAT);
    const passing = randomBetween(MIN_CPU_STAT, MAX_CPU_STAT);
    const dribbling = randomBetween(MIN_CPU_STAT, MAX_CPU_STAT);
    const defending = randomBetween(MIN_CPU_STAT, MAX_CPU_STAT);
    const physical = randomBetween(MIN_CPU_STAT, MAX_CPU_STAT);

    const player: Player = {
      id: 3000 + index,
      name: `CPU ${position}`,
      club: 'CPU FC',
      nation: 'CPU',
      position,
      pace,
      shooting,
      passing,
      dribbling,
      defending,
      physical,
      rating: 0,
      image_url: '',
    };

    return {
      ...player,
      rating: calculatePlayerOVR(player),
    };
  });

export const calculateTeamOVR = (squad: Player[]): number => {
  if (!squad || squad.length === 0) {
    return 0;
  }
  let validCount = 0;
  const total = squad.reduce((acc, player) => {
    if (!player) return acc;
    validCount++;
    const p = player?.name ? player : (player as any)?.player_data;
    return acc + (p?.rating ?? calculatePlayerOVR(player));
  }, 0);
  return validCount === 0 ? 0 : Math.round(total / validCount);
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
  players.filter((player) => {
    if (!player) return false;
    const p = player?.name ? player : (player as any)?.player_data;
    return positions.includes(p?.position);
  });

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

  const userAttackChance =
    0.5 + (mentality === 'attack' ? 0.1 : mentality === 'defense' ? -0.1 : 0);
  const isUserAttack = Math.random() < userAttackChance;

  const userAttackers = findPlayersByPositionGroup(
    playerSquad,
    attackerPositions as unknown as readonly string[],
  );
  const cpuAttackers = findPlayersByPositionGroup(
    cpuSquad,
    attackerPositions as unknown as readonly string[],
  );
  const userDefenders = findPlayersByPositionGroup(
    playerSquad,
    defenderPositions as unknown as readonly string[],
  );
  const cpuDefenders = findPlayersByPositionGroup(
    cpuSquad,
    defenderPositions as unknown as readonly string[],
  );

  const attacker =
    pickRandom(isUserAttack ? userAttackers : cpuAttackers) ??
    pickRandom(isUserAttack ? playerSquad : cpuSquad)!;
  const defender =
    pickRandom(isUserAttack ? cpuDefenders : userDefenders) ??
    pickRandom(isUserAttack ? cpuSquad : playerSquad);

  if (!attacker || !defender) {
    return {
      type: 'neutral',
      team: 'none',
      message: 'Possession changes hands.',
    };
  }

  const safeAttacker = attacker?.name ? attacker : (attacker as any)?.player_data || {};
  const safeDefender = defender?.name ? defender : (defender as any)?.player_data || {};
  const attackerName = safeAttacker?.name || 'Attacker';
  const defenderName = safeDefender?.name || 'Defender';

  const attackingTeamOVR = calculateTeamOVR(isUserAttack ? playerSquad : cpuSquad);
  const defendingTeamOVR = calculateTeamOVR(isUserAttack ? cpuSquad : playerSquad);
  const momentum = (attackingTeamOVR - defendingTeamOVR) * 0.5;

  const effectiveAttackerPAC = (safeAttacker?.pace ?? 50) + randomBetween(0, 10);
  const effectiveDefenderPAC = (safeDefender?.pace ?? 50) + 8 + randomBetween(0, 10);

  if (effectiveDefenderPAC > effectiveAttackerPAC + 5) {
    return {
      type: 'save',
      team: isUserAttack ? 'cpu' : 'user',
      message: isUserAttack
        ? `${defenderName} tracks back and wins the challenge cleanly.`
        : `${defenderName} reads the run and snuffs out the attack.`,
    };
  }

  let attackScore = (safeAttacker?.shooting ?? 50) + (safeAttacker?.physical ?? 50) * 0.3 + momentum + randomBetween(0, 15);
  const defenseScore = (safeDefender?.defending ?? 50) + (safeDefender?.physical ?? 50) * 0.5 + randomBetween(0, 15);

  if (mentality === 'attack' && isUserAttack) {
    attackScore *= 1.1;
  }

  if (attackScore > defenseScore) {
    return {
      type: 'goal',
      team: isUserAttack ? 'user' : 'cpu',
      message: isUserAttack
        ? `${attackerName} breaks through and finishes clinically.`
        : `${attackerName} powers one beyond the keeper for CPU.`,
    };
  }

  const margin = attackScore - defenseScore;
  if (margin >= -3) {
    return {
      type: 'save',
      team: isUserAttack ? 'cpu' : 'user',
      message: isUserAttack
        ? `${defenderName} makes a strong save to deny the chance.`
        : `${defenderName} blocks the shot with excellent positioning.`,
    };
  }

  return {
    type: 'miss',
    team: isUserAttack ? 'user' : 'cpu',
    message: isUserAttack
      ? `${attackerName} misses the target from a promising move.`
      : `${attackerName} cannot keep the effort on frame.`,
  };
};
