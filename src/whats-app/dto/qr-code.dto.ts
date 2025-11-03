import { ApiProperty } from '@nestjs/swagger';

export class QrCodeDto {

  @ApiProperty({ type: Date })
  createDateTime: string;

  @ApiProperty({ type: String })
  qrImage: string;
}
