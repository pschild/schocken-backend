import { isCelebration } from './celebration.utils';

describe('CelebrationUtils', () => {
  it.each([
    [-500, false],
    [0, false],
    [1, true],
    [1.1, false],
    [2, false],
    [10, false],
    [50, false],
    [100, true],
    [500, true],
    [900, true],
    [1000, true],
    [1001, false],
    [1100, false],
    [1500, true],
    [2000, true],
    [19000, true],
    [19500, true],
  ])('celebration for %p is %p', (count: number, result: boolean) => {
    expect(isCelebration(count)).toEqual(result);
  });
});
