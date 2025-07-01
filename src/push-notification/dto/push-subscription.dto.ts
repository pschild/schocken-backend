import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { PushSubscription } from 'web-push';

export class PushSubscriptionKeys {

  @ApiProperty({ type: String })
  @IsString()
  p256dh: string;

  @ApiProperty({ type: String })
  @IsString()
  auth: string;
}

export class PushSubscriptionDto implements PushSubscription {

  @ApiProperty({ type: String })
  @IsString()
  endpoint: string;

  @ApiPropertyOptional({ type: Number, nullable: true })
  expirationTime?: number | null;

  @ApiProperty({ type: PushSubscriptionKeys })
  keys: PushSubscriptionKeys;
}
