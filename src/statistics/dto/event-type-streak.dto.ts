import { ApiProperty } from '@nestjs/swagger';
import { EventTypeStreakModeEnum } from '../streak/enum/event-type-streak-mode.enum';
import { StreakDto } from './streak.dto';

export class EventTypeStreakDto {

  @ApiProperty({ type: String, format: 'uuid' })
  eventTypeId: string;

  @ApiProperty({ type: String })
  description: string;

  @ApiProperty({ enum: EventTypeStreakModeEnum, example: EventTypeStreakModeEnum.WITH_EVENT })
  mode: EventTypeStreakModeEnum;

  @ApiProperty({ type: [StreakDto] })
  streaks: StreakDto[];
}
