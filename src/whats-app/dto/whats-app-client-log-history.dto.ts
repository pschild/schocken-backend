import { ApiProperty } from '@nestjs/swagger';

export class WhatsAppClientLogHistoryDto {

  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: Date })
  datetime: string;

  @ApiProperty({ type: String })
  type: string;

  @ApiProperty({ type: String })
  message: string;

}
