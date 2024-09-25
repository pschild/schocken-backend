import { ApiProperty } from '@nestjs/swagger';

export class CelebrationDto {
  @ApiProperty({ type: String })
  label: string;

  @ApiProperty({ type: Number })
  count: number;
}
