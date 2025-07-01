import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiProduces, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { PushSubscription, SendResult } from 'web-push';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import { User } from '../auth/model/user.model';
import { PushSubscriptionDto } from './dto/push-subscription.dto';
import { PushNotificationService } from './push-notification.service';

@ApiTags('push-notification')
@Controller('push-notification')
export class PushNotificationController {

  constructor(
    private service: PushNotificationService
  ) {
  }

  @Get('vapidPublicKey')
  @ApiOkResponse({ type: String })
  @ApiProduces('text/plain')
  public getPublicKey(): string {
    return this.service.getPublicKey();
  }

  @Post('notifications/subscribe')
  @ApiBody({ type: PushSubscriptionDto })
  @ApiCreatedResponse({ type: String })
  @ApiProduces('text/plain')
  public subscribe(@Body() sub: PushSubscription, @CurrentUser() user: User): Observable<string> {
    return this.service.subscribe(sub, user);
  }

  @Delete('notifications/unsubscribe/:endpoint')
  @ApiOkResponse({ type: String })
  @ApiProduces('text/plain')
  public unsubscribe(@Param('endpoint') endpoint: string, @CurrentUser() user: User): Observable<string> {
    return this.service.unsubscribe(endpoint, user);
  }

  @Post('notifications/send')
  public send(): Observable<SendResult[]> {
    return this.service.send();
  }
}
