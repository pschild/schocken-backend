import { ApiProperty } from '@nestjs/swagger';
import { PlaceType } from '../enum/place-type.enum';

export class PlaceDto {
  @ApiProperty({ enum: PlaceType })
  type: PlaceType;

  @ApiProperty({ type: String, required: false })
  location?: string;
}
