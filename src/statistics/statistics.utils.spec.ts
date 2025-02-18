import { addRanking } from './statistics.utils';

describe('StatisticsUtils', () => {

  describe('rank', () => {
    it('should sort ascending', () => {
      const items = [
        { name: 'P1', points: 10 },
        { name: 'P2', points: 11 },
        { name: 'P3', points: 9 },
      ];

      expect(addRanking(items, ['points'])).toStrictEqual([
        { rank: 1, name: 'P3', points: 9 },
        { rank: 2, name: 'P1', points: 10 },
        { rank: 3, name: 'P2', points: 11 },
      ]);
    });

    it('should sort descending', () => {
      const items = [
        { name: 'P1', points: 10 },
        { name: 'P2', points: 11 },
        { name: 'P3', points: 9 },
      ];

      expect(addRanking(items, ['points'], ['desc'])).toStrictEqual([
        { rank: 1, name: 'P2', points: 11 },
        { rank: 2, name: 'P1', points: 10 },
        { rank: 3, name: 'P3', points: 9 },
      ]);
    });

    it('should add ranks correctly when value is the same', () => {
      const items = [
        { name: 'P1', points: 10 },
        { name: 'P2', points: 11 },
        { name: 'P3', points: 9 },
        { name: 'P4', points: 10 },
      ];

      expect(addRanking(items, ['points'], ['desc'])).toStrictEqual([
        { rank: 1, name: 'P2', points: 11 },
        { rank: 2, name: 'P1', points: 10 },
        { rank: 2, name: 'P4', points: 10 },
        { rank: 3, name: 'P3', points: 9 },
      ]);
    });

    it('should add ranks correctly when multiple values are the same', () => {
      const items = [
        { name: 'P1', points: 10, quote: 0.5, fooCount: 30 },
        { name: 'P2', points: 11, quote: 0.4, fooCount: 40 },
        { name: 'P3', points: 9,  quote: 0.6, fooCount: 20 },
        { name: 'P4', points: 10, quote: 0.5, fooCount: 30 },
      ];

      expect(addRanking(items, ['points', 'quote', 'fooCount'], ['desc', 'desc', 'asc'])).toStrictEqual([
        { rank: 1, name: 'P2', points: 11, quote: 0.4, fooCount: 40 },
        { rank: 2, name: 'P1', points: 10, quote: 0.5, fooCount: 30 },
        { rank: 2, name: 'P4', points: 10, quote: 0.5, fooCount: 30 },
        { rank: 3, name: 'P3', points: 9,  quote: 0.6, fooCount: 20 },
      ]);
    });
  });
});
