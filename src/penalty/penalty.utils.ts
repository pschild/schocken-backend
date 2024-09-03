import { EventDto } from '../event/dto/event.dto';
import { PenaltyUnit } from './enum/penalty-unit.enum';

export function summarizePenalties(events: EventDto[]): { unit: string, sum: number }[] {
  return Object.keys(PenaltyUnit)
    .map(unit => {
      const sum = events
        .filter(e => e.penaltyUnit === unit)
        .reduce((prev, curr) => prev + multiplyPenaltyValue(curr.multiplicatorValue, curr.penaltyValue), 0);
      return { unit, sum: +sum.toFixed(2) };
    })
    .filter(penaltySum => penaltySum.sum > 0);
}

function multiplyPenaltyValue(multiplicatorValue: number, penaltyValue: number): number {
  return (multiplicatorValue || 1) * penaltyValue;
}
