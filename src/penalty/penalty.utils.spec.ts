import { EventDto } from '../event/dto/event.dto';
import { PenaltyUnit } from './enum/penalty-unit.enum';
import { addPenalties, penaltySumByUnit, summarizePenalties } from './penalty.utils';

describe('PenaltyUtils', () => {

  describe('should summarize the correct penalties', () => {
    it('when no events given', () => {
      const events = [];
      expect(summarizePenalties(events)).toStrictEqual([]);
    });

    it('when there is only one penalty', () => {
      const events = [
        { penaltyValue: 0.5, penaltyUnit: PenaltyUnit.EURO },
      ] as EventDto[];
      expect(summarizePenalties(events)).toStrictEqual([{ unit: PenaltyUnit.EURO, sum: 0.5 }]);
    });

    it('when there are penalties for only one unit', () => {
      const events = [
        { penaltyValue: 0.5, penaltyUnit: PenaltyUnit.EURO },
        { penaltyValue: 0.1, penaltyUnit: PenaltyUnit.EURO, multiplicatorValue: 6 },
        { penaltyValue: 5, penaltyUnit: PenaltyUnit.EURO },
        { penaltyValue: 0, penaltyUnit: PenaltyUnit.BEER_CRATE },
      ] as EventDto[];
      expect(summarizePenalties(events)).toStrictEqual([{ unit: PenaltyUnit.EURO, sum: 6.1 }]);
    });

    it('when there are penalties for multiple one unit', () => {
      const events = [
        { penaltyValue: 0.5, penaltyUnit: PenaltyUnit.EURO },
        { penaltyValue: 0.1, penaltyUnit: PenaltyUnit.EURO, multiplicatorValue: 6 },
        { penaltyValue: 5, penaltyUnit: PenaltyUnit.EURO },
        { penaltyValue: 1, penaltyUnit: PenaltyUnit.BEER_CRATE, multiplicatorValue: 2 },
      ] as EventDto[];
      expect(summarizePenalties(events)).toStrictEqual([{ unit: PenaltyUnit.EURO, sum: 6.1 }, { unit: PenaltyUnit.BEER_CRATE, sum: 2 }]);
    });
  });

  describe('should add two penalties', () => {
    it('when no penalties given', () => {
      const penalty1 = null;
      const penalty2 = null;
      expect(addPenalties(penalty1, penalty2)).toBeNull();
    });

    it('when empty penalties given', () => {
      const penalty1 = [];
      const penalty2 = [];
      expect(addPenalties(penalty1, penalty2)).toStrictEqual([{ unit: PenaltyUnit.EURO, sum: 0 }, { unit: PenaltyUnit.BEER_CRATE, sum: 0 }]);
    });

    it('when penalties with different units given', () => {
      const penalty1 = [{ unit: PenaltyUnit.EURO, sum: 0.5 }];
      const penalty2 = [{ unit: PenaltyUnit.EURO, sum: 0.75 }, { unit: PenaltyUnit.BEER_CRATE, sum: 1 }];
      expect(addPenalties(penalty1, penalty2)).toStrictEqual([{ unit: PenaltyUnit.EURO, sum: 1.25 }, { unit: PenaltyUnit.BEER_CRATE, sum: 1 }]);
    });
  });

  describe('should get sum by unit', () => {
    it('when no penalty given', () => {
      expect(penaltySumByUnit(null, PenaltyUnit.EURO)).toBe(0);
    });

    it('when empty penalty given', () => {
      expect(penaltySumByUnit([], PenaltyUnit.EURO)).toBe(0);
    });

    it('when other penalty given', () => {
      expect(penaltySumByUnit([{ unit: PenaltyUnit.BEER_CRATE, sum: 2 }], PenaltyUnit.EURO)).toBe(0);
    });

    it('when penalty given', () => {
      expect(penaltySumByUnit([{ unit: PenaltyUnit.EURO, sum: 2.5 }], PenaltyUnit.EURO)).toBe(2.5);
    });
  });
});
