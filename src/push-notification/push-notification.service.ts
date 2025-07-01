import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { catchError, defaultIfEmpty, filter, from, mergeAll, mergeMap, Observable, of, switchMap, toArray } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Repository } from 'typeorm';
import { PushSubscription, sendNotification, SendResult, setVapidDetails, WebPushError } from 'web-push';
import { Logger } from 'winston';
import { User } from '../auth/model/user.model';
import { PushSubscription as PushSubscriptionEntity } from '../model/push-subscription.entity';

@Injectable()
export class PushNotificationService {

  constructor(
    private configService: ConfigService,
    @InjectRepository(PushSubscriptionEntity) private readonly repo: Repository<PushSubscriptionEntity>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    setVapidDetails(
      `mailto:${configService.get<string>('VAPID_SUBJECT')}`,
      configService.get<string>('VAPID_PUBLIC_KEY'),
      configService.get<string>('VAPID_PRIVATE_KEY')
    );
  }

  getPublicKey(): string {
    return this.configService.get<string>('VAPID_PUBLIC_KEY');
  }

  subscribe(subscription: PushSubscription, currentUser: User): Observable<string> {
    return from(this.repo.save({
      auth0UserId: currentUser.userId,
      endpoint: subscription.endpoint,
      p256dhKey: subscription.keys.p256dh,
      authKey: subscription.keys.auth,
    })).pipe(
      map(entity => entity.id)
    );
  }

  unsubscribe(endpoint: string, currentUser: User): Observable<string> {
    return from(this.repo.findOneBy({auth0UserId: currentUser.userId, endpoint})).pipe(
      filter(Boolean),
      switchMap(entity => from(this.repo.remove(entity))),
      map(entity => entity.id),
      defaultIfEmpty(null),
    );
  }

  send(): Observable<SendResult[]> {
    return from(this.repo.find()).pipe(
      mergeAll(),
      mergeMap(subscription => this.sendNotification(subscription).pipe(
        catchError((err: Error) => {
          this.logger.error(`Error during sending push notification to ${subscription.auth0UserId}: ${err}`);
          if (err instanceof WebPushError && err.statusCode === 410) {
            this.logger.info(`Cleaning up subscription ${subscription.id} for user ${subscription.auth0UserId}...`);
            return from(this.repo.delete({ id: subscription.id })).pipe(map(() => null));
          }
          return of(null);
        })
      )),
      toArray(),
      map(sentNotifications => sentNotifications.filter(notification => !!notification)),
      tap(sentNotifications => {
        if (sentNotifications.length > 0) {
          this.logger.info(`Successfully sent ${sentNotifications.length} notification(s)!`);
        } else {
          this.logger.info(`No notifications were sent!`)
        }
      }),
    );
  }

  private sendNotification(subscription: PushSubscriptionEntity): Observable<SendResult> {
    const sub: PushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dhKey,
        auth: subscription.authKey
      }
    };

    return from(sendNotification(sub, JSON.stringify({
      notification: {
        title: 'Hi Hopti!',
        body: `${subscription.auth0UserId} um ${new Date().toLocaleTimeString()} Uhr`,
        icon: 'https://raw.githubusercontent.com/mdn/dom-examples/refs/heads/main/to-do-notifications/img/icon-128.png',
        vibrate: [100, 50, 100],
        actions: [
          {action: 'foo', title: 'Statistiken'},
          // {action: 'bar', title: 'Focus last'},
          {action: 'baz', title: 'Spiel 8fe'},
        ],
        data: {
          onActionClick: {
            default: {operation: 'openWindow'},
            foo: {operation: 'openWindow', url: '/statistics'},
            // bar: {operation: 'focusLastFocusedOrOpen', url: 'calendar'},
            baz: {operation: 'navigateLastFocusedOrOpen', url: '/game/8fe9bdc5-8645-475e-9adc-2064e1283315'},
          }
        }
      }
    })));
  }
}
