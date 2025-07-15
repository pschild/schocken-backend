import { ApiProperty } from '@nestjs/swagger';

export class WhatsAppClientStatusDto {

  @ApiProperty({ type: Boolean })
  isInitialized: boolean;

  @ApiProperty({ type: Boolean })
  isAuthenticated: boolean;

  @ApiProperty({ type: Boolean })
  isReady: boolean;

  @ApiProperty({ type: String })
  waState: string;

}
