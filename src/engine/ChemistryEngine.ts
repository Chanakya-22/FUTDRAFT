import { Player } from '../types';

export type PositionSlot = 'LW' | 'ST' | 'RW' | 'CM1' | 'CDM' | 'CM2' | 'LB' | 'CB1' | 'CB2' | 'RB' | 'GK';

// 1. The 4-3-3 Link Map
export const LINK_MAP: Record<PositionSlot, PositionSlot[]> = {
  'ST': ['LW', 'RW', 'CM1', 'CM2'],
  'LW': ['ST', 'CM1', 'LB'],
  'RW': ['ST', 'CM2', 'RB'],
  'CM1': ['LW', 'ST', 'CDM', 'LB', 'CB1'],
  'CDM': ['CM1', 'CM2', 'CB1', 'CB2'],
  'CM2': ['RW', 'ST', 'CDM', 'RB', 'CB2'],
  'LB': ['LW', 'CM1', 'CB1'],
  'CB1': ['LB', 'CDM', 'CB2', 'GK'],
  'CB2': ['RB', 'CDM', 'CB1', 'GK'],
  'RB': ['RW', 'CM2', 'CB2'],
  'GK': ['CB1', 'CB2']
};

// 2. The Link Scoring System
export const calculateLinkPoints = (p1: Player | undefined, p2: Player | undefined): number => {
  if (!p1 || !p2) return 0;

  // Normalizing strings to lowercase to prevent case-sensitive mismatches
  const n1 = p1.nation?.toLowerCase();
  const n2 = p2.nation?.toLowerCase();
  const c1 = p1.club?.toLowerCase();
  const c2 = p2.club?.toLowerCase();
  const l1 = p1.league?.toLowerCase();
  const l2 = p2.league?.toLowerCase();

  const sameNation = n1 === n2 && !!n1;
  const sameClub = c1 === c2 && !!c1;
  // If they play for the same club, they inherently play in the same league
  const sameLeague = (l1 === l2 && !!l1) || sameClub; 

  if (sameClub && sameNation) return 3; // 🟢✨ Perfect Link
  if (sameLeague && sameNation) return 2; // 🟢 Strong Link
  if (sameClub) return 2; // 🟢 Strong Link
  if (sameLeague || sameNation) return 1; // 🟡 Weak Link
  
  return 0; // 🔴 Dead Link
};

// 3. The Master Calculator
export const calculateSquadStats = (squad: Partial<Record<PositionSlot, Player>>) => {
  let totalChemistry = 0;
  let totalRating = 0;
  let playerCount = 0;

  const positions = Object.keys(LINK_MAP) as PositionSlot[];

  // Calculate Individual Chemistry for each placed player
  positions.forEach((pos) => {
    const player = squad[pos];
    if (player) {
      playerCount++;
      totalRating += player.rating;

      const connections = LINK_MAP[pos];
      let earnedPoints = 0;

      // Check links to surrounding players
      connections.forEach((targetPos) => {
        const targetPlayer = squad[targetPos];
        if (targetPlayer) {
          earnedPoints += calculateLinkPoints(player, targetPlayer);
        }
      });

      // Golden Rule: Max 10 Chem per player if Points >= Connections
      // If connections = 0 (impossible in this map, but safe math), grant 10.
      let indChem = 0;
      if (connections.length > 0) {
        indChem = Math.floor((earnedPoints / connections.length) * 10);
        if (indChem > 10) indChem = 10;
        // FUT classic rule: Placed in correct position gives base chem (assume everyone is placed correctly for now)
        if (earnedPoints >= connections.length) indChem = 10; 
      }
      
      totalChemistry += indChem;
    }
  });

  // Calculate Team OVR (Average)
  const teamOVR = playerCount > 0 ? Math.round(totalRating / 11) : 0; 
  // Note: We divide by 11 to reflect true team rating, even if incomplete.

  // Cap total chemistry at 100
  const finalChemistry = totalChemistry > 100 ? 100 : totalChemistry;

  return {
    chemistry: finalChemistry,
    ovr: teamOVR,
    playersPlaced: playerCount
  };
};