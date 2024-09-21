import { Event } from '../../model/event.entity';
import { PenaltyUnit } from '../../penalty/enum/penalty-unit.enum';

export class EventPenaltyDto {
  multiplicatorValue: number;
  penaltyValue?: number;
  penaltyUnit?: PenaltyUnit;

  static fromEntity(entity: Event): EventPenaltyDto {
    return {
      multiplicatorValue: +entity.multiplicatorValue,
      penaltyValue: +entity.penaltyValue,
      penaltyUnit: entity.penaltyUnit,
    };
  }

  static fromEntities(entites: Event[]): EventPenaltyDto[] {
    return entites.map(e => EventPenaltyDto.fromEntity(e));
  }
}
