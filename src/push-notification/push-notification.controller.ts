import { Body, Controller, Get, Post } from '@nestjs/common';
import { Observable } from 'rxjs';
import { PushSubscription, SendResult } from 'web-push';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import { User } from '../auth/model/user.model';
import { PushNotificationService } from './push-notification.service';

@Controller('push-notification')
export class PushNotificationController {

  constructor(
    private service: PushNotificationService
  ) {
  }

  @Get('vapidPublicKey')
  public getPublicKey(): string {
    return this.service.getPublicKey();
  }

  @Post('notifications/subscribe')
  public subscribe(@Body() sub: PushSubscription, @CurrentUser() user: User): Observable<null> {
    return this.service.subscribe(sub, user);
  }

  @Post('notifications/unsubscribe')
  public unsubscribe(@Body() sub: PushSubscription, @CurrentUser() user: User): null {
    this.service.unsubscribe(sub, user);
    return null;
  }

  @Post('notifications/send')
  public send(): Observable<SendResult[]> {
    // return this.service.send();
    return this.service.sendDb();
  }
}
