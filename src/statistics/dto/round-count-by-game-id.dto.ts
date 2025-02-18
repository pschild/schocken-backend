import { ApiProperty } from '@nestjs/swagger';

export class RoundCountByGameIdDto {

  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: Date })
  datetime: Date;

  @ApiProperty({ type: Number })
  roundCount: number;
}
