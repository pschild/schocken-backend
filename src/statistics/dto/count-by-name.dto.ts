import { ApiProperty } from '@nestjs/swagger';

export class CountByNameDto {

  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: Number })
  count: number;
}
