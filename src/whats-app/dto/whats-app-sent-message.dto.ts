import { ApiProperty } from '@nestjs/swagger';

export class WhatsAppSentMessageDto {

  @ApiProperty({ type: String })
  messageId: string;

}
