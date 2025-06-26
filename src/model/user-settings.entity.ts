import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'user_settings' })
export class UserSettings {

  @PrimaryColumn({ length: 64 })
  auth0UserId: string;

  @Column({ default: false })
  enablePushNotifications: boolean;

}

