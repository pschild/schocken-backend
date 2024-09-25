import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class UpdateAttendanceDto {
  @ApiProperty({ type: String, format: 'uuid', isArray: true })
  @IsArray()
  @IsUUID('all', { each: true })
  playerIds: string[];
}
