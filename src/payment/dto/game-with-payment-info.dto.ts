import { ApiProperty } from '@nestjs/swagger';

export class GameWithPaymentInfoDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: Date })
  datetime: string;

  @ApiProperty({ type: Boolean })
  allConfirmed: boolean;

}
