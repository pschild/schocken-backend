import { ApiProperty } from '@nestjs/swagger';
import { RecordDto } from './record.dto';

export class RecordsPerGameDto {

  @ApiProperty({ type: String, format: 'uuid' })
  eventTypeId: string;

  @ApiProperty({ type: String })
  description: string;

  @ApiProperty({ type: [RecordDto] })
  records: RecordDto[];
}
