import { ApiProperty } from '@nestjs/swagger';

export class RecordDto {

  @ApiProperty({ type: String, format: 'uuid' })
  gameId: string;

  @ApiProperty({ type: String })
  datetime: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: Number })
  count: number;
}

export class RecordsPerGameDto {

  @ApiProperty({ type: String, format: 'uuid' })
  eventTypeId: string;

  @ApiProperty({ type: String })
  description: string;

  @ApiProperty({ type: [RecordDto] })
  records: RecordDto[];
}
