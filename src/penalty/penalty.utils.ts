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

export function addPenalties(penalties1: PenaltyDto[], penalties2: PenaltyDto[]): PenaltyDto[] {
  if (!Array.isArray(penalties1) || !Array.isArray(penalties2)) {
    return null;
  }
  return Object.keys(PenaltyUnit)
    .map(unit => {
      const sum1ByUnit = penalties1.find(p => p.unit === unit)?.sum || 0;
      const sum2ByUnit = penalties2.find(p => p.unit === unit)?.sum || 0;
      return { unit, sum: sum1ByUnit + sum2ByUnit };
    });
}

export function penaltySumByUnit(penalties: PenaltyDto[], unit: PenaltyUnit): number {
  return penalties?.find(p => p.unit === unit)?.sum || 0;
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
