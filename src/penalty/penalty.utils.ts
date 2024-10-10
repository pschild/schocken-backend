import { EventPenaltyDto } from '../event/dto/event-penalty.dto';
import { PenaltyDto } from './dto/penalty.dto';
import { PenaltyUnit } from './enum/penalty-unit.enum';

export function summarizePenalties(penalties: EventPenaltyDto[]): PenaltyDto[] {
  return Object.keys(PenaltyUnit)
    .map(unit => {
      const sum = penalties
        .filter(e => e.penaltyUnit === unit)
        .reduce((prev, curr) => prev + summarizePenalty(curr).sum, 0);
      return { unit, sum };
    })
    .filter(penaltySum => penaltySum.sum > 0);
}

export function summarizePenalty(penalties: EventPenaltyDto): PenaltyDto {
  return {
    sum: multiplyPenaltyValue(penalties.multiplicatorValue, penalties.penaltyValue),
    unit: penalties.penaltyUnit
  };
}

function multiplyPenaltyValue(multiplicatorValue: number, penaltyValue: number): number {
  return (multiplicatorValue || 1) * penaltyValue;
}
