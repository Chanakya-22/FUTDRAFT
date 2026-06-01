import { Player } from '../types';

export interface MatchStats {
  ovr: number;
  chemistry: number;
  name?: string;
}

export interface MatchResult {
  userScore: number;
  oppScore: number;
  events: string[];
  coinsEarned: number;
  result: 'WIN' | 'DRAW' | 'LOSS';
}

export const generateOpponent = (): MatchStats => {
  const clubs = [
    'Real Madrid',
    'Manchester City',
    'Bayern Munich',
    'Arsenal',
    'Paris SG',
    'Juventus',
    'Liverpool',
    'FC Barcelona',
    'Inter Milan',
    'Bayer Leverkusen'
  ];

  const ovr = Math.floor(Math.random() * (90 - 75 + 1)) + 75;
  const chemistry = Math.floor(Math.random() * (100 - 50 + 1)) + 50;
  const name = clubs[Math.floor(Math.random() * clubs.length)];

  return { ovr, chemistry, name };
};

export const simulateMatch = (user: MatchStats, opp: MatchStats): MatchResult => {
  // 1. Calculate Power Levels
  const userPower = user.ovr + (user.chemistry * 0.25);
  const oppPower = opp.ovr + (opp.chemistry * 0.25);

  // 2. Base Expected Goals based on Power Discrepancy
  const expectedUserGoals = (userPower / oppPower) * 1.5;
  const expectedOppGoals = (oppPower / userPower) * 1.5;

  // 3. RNG Variance (Random factor between -1.0 and +1.0)
  const userScore = Math.max(0, Math.round(expectedUserGoals + (Math.random() * 2 - 1)));
  const oppScore = Math.max(0, Math.round(expectedOppGoals + (Math.random() * 2 - 1)));

  // 4. Determine Results & Rewards
  let result: 'WIN' | 'DRAW' | 'LOSS';
  let coinsEarned: number;

  if (userScore > oppScore) {
    result = 'WIN';
    coinsEarned = 500;
  } else if (userScore === oppScore) {
    result = 'DRAW';
    coinsEarned = 200;
  } else {
    result = 'LOSS';
    coinsEarned = 100;
  }

  // 5. Play-by-Play Event Generation
  const rawEvents: string[] = [];

  for (let i = 0; i < userScore; i++) {
    const minute = Math.floor(Math.random() * 90) + 1;
    rawEvents.push(`${minute}' - ⚽ GOAL for You!`);
  }

  for (let i = 0; i < oppScore; i++) {
    const minute = Math.floor(Math.random() * 90) + 1;
    rawEvents.push(`${minute}' - 🔴 GOAL for ${opp.name}.`);
  }

  if (Math.random() < 0.5) {
    const minute = Math.floor(Math.random() * 90) + 1;
    rawEvents.push(`${minute}' - 🟨 Yellow Card shown.`);
  }

  if (Math.random() < 0.8) {
    const minute = Math.floor(Math.random() * 90) + 1;
    rawEvents.push(`${minute}' - 🧤 Great Save!`);
  }

  // Sort events chronologically by parsing the minute from the string
  rawEvents.sort((a, b) => {
    const minA = parseInt(a.split("'")[0], 10);
    const minB = parseInt(b.split("'")[0], 10);
    return minA - minB;
  });

  // Compile final array
  const events: string[] = [];
  events.push(`Kickoff! Match against ${opp.name} begins.`);
  events.push(...rawEvents);
  events.push(`FULL TIME - Final Score: You ${userScore} - ${oppScore} ${opp.name}.`);

  return {
    userScore,
    oppScore,
    events,
    coinsEarned,
    result
  };
};

export const calculateTeamOVR = (players: Player[]): number => {
  if (!players || players.length === 0) return 0;
  const total = players.reduce((sum, player) => sum + player.rating, 0);
  return Math.round(total / players.length);
};
