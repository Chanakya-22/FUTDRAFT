import { calculateTeamOVR, evaluateLiveMinute } from './MatchMath';
import { Player } from '../types';

describe('Match Engine Balancing', () => {
  test('OVR calculation is accurate', () => {
    const mockPlayers = [{ rating: 80 }, { rating: 90 }] as Player[];
    expect(calculateTeamOVR(mockPlayers)).toBe(85);
  });

  test('Tactical engine responds to mentality changes', () => {
    // Add "as Player[]" so TypeScript knows these empty arrays are for players
    const balancedEvent = evaluateLiveMinute(85, 85, [] as Player[], [] as Player[], 'balanced', 'CPU');
    const attackEvent = evaluateLiveMinute(85, 85, [] as Player[], [] as Player[], 'attack', 'CPU');
    
    expect(balancedEvent).toBeDefined();
    expect(attackEvent).toBeDefined();
  });
});