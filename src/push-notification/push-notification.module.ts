import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PushSubscription } from '../model/push-subscription.entity';
import { UserSettings } from '../model/user-settings.entity';
import { PushNotificationController } from './push-notification.controller';
import { PushNotificationService } from './push-notification.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserSettings, PushSubscription])],
  providers: [PushNotificationService],
  controllers: [PushNotificationController],
})
export class PushNotificationModule {}
