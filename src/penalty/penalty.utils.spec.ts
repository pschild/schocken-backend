import { EventDto } from '../event/dto/event.dto';
import { PenaltyUnit } from './enum/penalty-unit.enum';
import { summarizePenalties } from './penalty.utils';

describe('PenaltyUtils', () => {

  describe('should calculate the correct penalties', () => {
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
});
