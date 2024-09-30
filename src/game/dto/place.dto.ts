import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlaceType } from '../enum/place-type.enum';

export class PlaceDto {
  @ApiProperty({ enum: PlaceType })
  type: PlaceType;

  @ApiPropertyOptional({ type: String })
  hostedById?: string;

  @ApiPropertyOptional({ type: String })
  locationLabel?: string;
}
