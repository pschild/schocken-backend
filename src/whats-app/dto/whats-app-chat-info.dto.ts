import { ApiProperty } from '@nestjs/swagger';

export class WhatsAppChatInfoDto {

  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: Boolean })
  isGroup: boolean;

}
