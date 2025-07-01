import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString, MaxLength } from 'class-validator';
import { UserSettings } from '../../model/user-settings.entity';

export class UserSettingsDto {

  @ApiProperty({ type: String, maxLength: 64 })
  @IsString()
  @MaxLength(64)
  auth0UserId: string;

  @ApiProperty({ type: Boolean })
  @IsBoolean()
  enablePushNotifications: boolean;

  static fromEntity(entity: UserSettings): UserSettingsDto {
    return entity ? {
      auth0UserId: entity.auth0UserId,
      enablePushNotifications: entity.enablePushNotifications,
    } : null;
  }
}
