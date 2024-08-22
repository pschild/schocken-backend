import { IsArray, IsUUID } from 'class-validator';

export class UpdateAttendanceDto {
  @IsArray()
  @IsUUID('all', { each: true })
  playerIds: string[];
}
