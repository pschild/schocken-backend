import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateUserSettingsDto {

  @ApiProperty({ type: String, maxLength: 64 })
  @IsString()
  @MaxLength(64)
  auth0UserId: string;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  enablePushNotifications: boolean;
}
