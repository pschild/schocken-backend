import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Event } from '../../model/event.entity';
import { PenaltyUnit } from '../../penalty/enum/penalty-unit.enum';

export class EventPenaltyDto {
  @ApiProperty({ type: Number })
  multiplicatorValue: number;

  @ApiPropertyOptional({ type: Number })
  penaltyValue?: number;

  @ApiPropertyOptional({ enum: PenaltyUnit, example: PenaltyUnit.EURO })
  penaltyUnit?: PenaltyUnit;

  static fromEntity(entity: Pick<Event, 'multiplicatorValue' | 'penaltyValue' | 'penaltyUnit'>): EventPenaltyDto {
    return {
      multiplicatorValue: +entity.multiplicatorValue,
      penaltyValue: +entity.penaltyValue,
      penaltyUnit: entity.penaltyUnit,
    };
  }

  static fromEntities(entites: Pick<Event, 'multiplicatorValue' | 'penaltyValue' | 'penaltyUnit'>[]): EventPenaltyDto[] {
    return entites.map(e => EventPenaltyDto.fromEntity(e));
  }
}
