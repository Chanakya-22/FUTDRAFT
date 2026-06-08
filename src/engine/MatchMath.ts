import { Player } from '../types';

export interface MatchStats { ovr: number; chemistry: number; name: string; }
export interface MatchResult { userScore: number; oppScore: number; events: string[]; coinsEarned: number; result: 'WIN' | 'DRAW' | 'LOSS'; }

export const calculateTeamOVR = (players: Player[]): number => {
  if (!players || players.length === 0) return 0;
  const total = players.reduce((sum, player) => {
    const rating = typeof player.rating === 'number'
      ? player.rating
      : Number((player as any)?.rating) || Number((player as any)?.player_data?.rating) || 0;
    return sum + rating;
  }, 0);
  return Math.round(total / players.length);
};

export const generateOpponent = (): MatchStats => {
  const clubs = ['Real Madrid', 'Manchester City', 'Bayern Munich', 'Arsenal', 'Paris SG', 'Juventus', 'Liverpool', 'FC Barcelona', 'Inter Milan', 'Bayer Leverkusen'];
  const ovr = Math.floor(Math.random() * (90 - 75 + 1)) + 75;
  const chemistry = Math.floor(Math.random() * (100 - 50 + 1)) + 50;
  return { ovr, chemistry, name: clubs[Math.floor(Math.random() * clubs.length)] };
};

export const simulateMatch = (user: MatchStats, opp: MatchStats): MatchResult => {
    // ... [KEEP YOUR EXISTING LEGACY SIMULATE FUNCTION HERE] ...
    return { userScore: 0, oppScore: 0, events: [], coinsEarned: 0, result: 'DRAW' }; 
};

// --- NEW LIVE TACTICAL ENGINE ---
export type LiveEvent = {
  type: 'none' | 'goal' | 'yellow' | 'chance' | 'corner' | 'foul';
  team?: 'user' | 'cpu';
  text?: string;
  playerId?: number;
  playerName?: string;
};

const average = (numbers: number[]): number =>
  numbers.length === 0 ? 0 : numbers.reduce((sum, value) => sum + value, 0) / numbers.length;

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const getPositionGroup = (team: Player[], positions: string[]): Player[] => {
  const selection = team.filter((player) => positions.includes(player.position));
  return selection.length > 0 ? selection : team;
};

const getAttackProfile = (team: Player[]): number => {
  const attackers = getPositionGroup(team, ['ST', 'CF', 'LW', 'RW', 'CAM', 'LM', 'RM']);
  return average(attackers.map((player) => player.shooting * 0.45 + player.dribbling * 0.25 + player.passing * 0.2 + player.pace * 0.1));
};

const getDefenseProfile = (team: Player[]): number => {
  const defenders = getPositionGroup(team, ['CB', 'LB', 'RB', 'LWB', 'RWB', 'CDM', 'GK']);
  return average(defenders.map((player) => player.defending * 0.45 + player.physical * 0.25 + player.pace * 0.15 + player.passing * 0.15));
};

export const pickPlayerWeighted = (team: Player[], isGoal: boolean): Player | undefined => {
  if (!team || team.length === 0) return undefined;
  const attackers = team.filter((p) => ['ST', 'CF', 'LW', 'RW', 'CAM', 'LM', 'RM'].includes(p.position));
  const pool = isGoal && attackers.length > 0 ? attackers : team;
  return pool[Math.floor(Math.random() * pool.length)];
};

export const evaluateLiveMinute = (
  userOVR: number,
  cpuOVR: number,
  userTeam: Player[],
  cpuTeam: Player[],
  mentality: 'attack' | 'balanced' | 'defense',
  cpuName: string,
  minute: number,
  scoreDiff: number,
): LiveEvent => {
  const userAttack = getAttackProfile(userTeam);
  const cpuAttack = getAttackProfile(cpuTeam);
  const userDefend = getDefenseProfile(userTeam);
  const cpuDefend = getDefenseProfile(cpuTeam);

  const ovrDelta = (userOVR - cpuOVR) * 0.0018;
  const userAttackDelta = (userAttack - cpuDefend) * 0.0002;
  const cpuAttackDelta = (cpuAttack - userDefend) * 0.0002;
  const userTrailing = scoreDiff < 0 ? 0.0035 : scoreDiff > 0 ? -0.0015 : 0;
  const cpuTrailing = scoreDiff > 0 ? 0.0035 : scoreDiff < 0 ? -0.0015 : 0;
  const latePressure = minute > 80 ? 0.0028 : minute > 70 ? 0.0015 : 0;

  const userGoalProb = clamp(
    0.003 + ovrDelta + userAttackDelta + userTrailing + (mentality === 'attack' ? 0.0012 : mentality === 'defense' ? -0.0008 : 0) + latePressure,
    0.002,
    0.045,
  );

  const cpuGoalProb = clamp(
    0.003 - ovrDelta + cpuAttackDelta + cpuTrailing + (mentality === 'defense' ? 0.0008 : mentality === 'attack' ? -0.001 : 0) + latePressure * 0.9,
    0.002,
    0.045,
  );

  const chanceIntensity = clamp(
    0.07 + Math.abs(userOVR - cpuOVR) * 0.0004 + (minute > 70 ? 0.008 : 0),
    0.03,
    0.12,
  );
  const cornerChanceProb = clamp(
    0.03 + (minute > 70 ? 0.005 : 0) + Math.abs(userOVR - cpuOVR) * 0.00015,
    0.02,
    0.08,
  );
  const foulIntensity = clamp(
    0.045 + (minute > 75 ? 0.004 : 0) + (Math.abs(scoreDiff) >= 2 ? 0.004 : 0),
    0.03,
    0.1,
  );
  const yellowChance = clamp(
    0.005 + (minute > 75 ? 0.0025 : 0) + (Math.abs(scoreDiff) >= 2 ? 0.0015 : 0),
    0.0035,
    0.01,
  );

  const rand = Math.random();
  if (rand < userGoalProb) {
    const scorer = pickPlayerWeighted(userTeam, true);
    return {
      type: 'goal',
      team: 'user',
      text: scorer
        ? `⚽ GOAL! ${scorer.name} finishes a slick move.`
        : `⚽ GOAL! Your team finds the net.`,
    };
  }

  if (rand < userGoalProb + cpuGoalProb) {
    const scorer = pickPlayerWeighted(cpuTeam, true);
    return {
      type: 'goal',
      team: 'cpu',
      text: scorer
        ? `🔴 GOAL! ${scorer.name} slots one home for ${cpuName}.`
        : `🔴 GOAL! ${cpuName} finds the net.`,
    };
  }

  if (rand < userGoalProb + cpuGoalProb + chanceIntensity) {
    const isUser = Math.random() > 0.5;
    const player = pickPlayerWeighted(isUser ? userTeam : cpuTeam, false);
    return {
      type: 'chance',
      team: isUser ? 'user' : 'cpu',
      text: isUser
        ? player
          ? `🔶 ${player.name} drives a dangerous chance into the box.`
          : '🔶 Your team creates a promising opening.'
        : player
          ? `🔶 ${player.name} tests the defense for ${cpuName}.`
          : `🔶 ${cpuName} builds pressure in attack.`,
    };
  }

  if (rand < userGoalProb + cpuGoalProb + chanceIntensity + cornerChanceProb) {
    const isUser = Math.random() > 0.5;
    return {
      type: 'corner',
      team: isUser ? 'user' : 'cpu',
      text: isUser
        ? `🟡 Corner for your side, pressure is building.`
        : `🟡 Corner for ${cpuName}, the defense must stay sharp.`,
    };
  }

  if (rand < userGoalProb + cpuGoalProb + chanceIntensity + cornerChanceProb + foulIntensity) {
    const isUser = Math.random() > 0.5;
    const player = pickPlayerWeighted(isUser ? userTeam : cpuTeam, false);
    return {
      type: 'foul',
      team: isUser ? 'user' : 'cpu',
      text: isUser
        ? player
          ? `🚩 ${player.name} gives away a foul in midfield.`
          : '🚩 Your team concedes a foul.'
        : player
          ? `🚩 ${player.name} brings down an opponent.`
          : `🚩 ${cpuName} concedes a foul.`,
    };
  }

  if (rand > 1 - yellowChance) {
    const isUser = Math.random() > 0.5;
    const team = isUser ? userTeam : cpuTeam;
    const player = pickPlayerWeighted(team, false);
    return {
      type: 'yellow',
      team: isUser ? 'user' : 'cpu',
      text: `🟨 Yellow card for ${player?.name || 'a player'} after a late challenge.`,
      playerId: player?.id,
      playerName: player?.name,
    };
  }

  return { type: 'none' };
};