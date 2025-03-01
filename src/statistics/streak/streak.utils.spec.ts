import { calculateCurrentStreak, calculateMaxStreak } from './streak.utils';

describe('StreakUtils', () => {

  describe('calculateMaxStreak', () => {
    it.each([
      [[], [], []],
      [['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], ['b'], ['b']],
      [['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], ['a', 'b', 'c', 'g', 'h'], ['a', 'b', 'c']],
      [['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], ['a', 'c', 'd', 'e', 'g', 'h'], ['c', 'd', 'e']],
      [['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], ['a', 'b', 'd', 'e', 'f', 'h'], ['d', 'e', 'f']],
      [['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], ['a', 'b', 'c', 'e', 'f', 'g'], ['a', 'b', 'c']],
    ])('should calculate streak correctly', (full: string[], part: string[], result: string[]) => {
      expect(calculateMaxStreak(full, part)).toStrictEqual(result);
    });

    it('should throw an error if element in parts is not found in full list', () => {
      expect(() => calculateMaxStreak(['a', 'b', 'c', 'd'], ['a', 'b', 'x'])).toThrow('Could not find element x in full list!');
    });
  });

  describe('calculateCurrentStreak', () => {
    it.each([
      [[], [], 0],
      [['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], ['g', 'h'], 2],
      [['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], ['a', 'b', 'c', 'f', 'g', 'h'], 3],
      [['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], ['a', 'c', 'd', 'e', 'f', 'g'], 0],
      [['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], ['b'], 0],
    ])('should calculate streak correctly', (full: string[], part: string[], result: number) => {
      expect(calculateCurrentStreak(full, part)).toBe(result);
    });

    it('should throw an error if element in parts is not found in full list', () => {
      expect(() => calculateMaxStreak(['a', 'b', 'c', 'd'], ['a', 'b', 'x'])).toThrow('Could not find element x in full list!');
    });
  });
});
