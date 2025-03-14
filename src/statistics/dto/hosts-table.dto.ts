import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlaceType } from '../../game/enum/place-type.enum';

export class HostsTableDto {

  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  hostedById: string | null;

  @ApiPropertyOptional({ type: String })
  name?: string;

  @ApiProperty({ enum: PlaceType, example: PlaceType.HOME })
  placeType: PlaceType;

  @ApiProperty({ type: Number })
  count: number;
}
