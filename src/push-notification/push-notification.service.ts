import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { catchError, from, mergeAll, mergeMap, Observable, of, switchMap, toArray } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Repository } from 'typeorm';
import { PushSubscription, sendNotification, SendResult, setVapidDetails } from 'web-push';
import { Logger } from 'winston';
import { User } from '../auth/model/user.model';
import { PushSubscription as PushSubscriptionEntity } from '../model/push-subscription.entity';
import { SubscriptionAlreadyExistsException } from './exception/subscription-already-exists.exception';

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

  findByUserId(id: string): Observable<PushSubscriptionEntity> {
    return from(this.repo.findOneBy({ auth0UserId: id }));
  }

  getPublicKey(): string {
    return this.configService.get<string>('VAPID_PUBLIC_KEY');
  }

  subscribe(subscription: PushSubscription, currentUser: User): Observable<null> {
    return this.findByUserId(currentUser.userId).pipe(
      switchMap(entity => {
        if (!!entity) {
          throw new SubscriptionAlreadyExistsException(entity.auth0UserId);
        }
        return from(this.repo.save({
          auth0UserId: currentUser.userId,
          endpoint: subscription.endpoint,
          p256dhKey: subscription.keys.p256dh,
          authKey: subscription.keys.auth,
        }));
      }),
      map(() => null),
    );
  }

  unsubscribe(subscription: PushSubscription, currentUser: User): void {
    // TODO
  }

  sendDb(): Observable<SendResult[]> {
    return from(this.repo.find()).pipe(
      mergeAll(),
      mergeMap(subscription => this.sendNotification(subscription).pipe(
        catchError(err => {
          this.logger.error(`Error during sending push notification to ${subscription.auth0UserId}: ${err}`);
          return of(null);
        })
      )),
      toArray(),
      tap(sentNotifications => this.logger.info(`Successfully sent ${sentNotifications} notification(s)`)),
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
        title: 'foo',
        body: `bar@${new Date().toISOString()}`,
        icon: 'https://raw.githubusercontent.com/mdn/dom-examples/refs/heads/main/to-do-notifications/img/icon-128.png',
        vibrate: [100, 50, 100],
        actions: [
          {action: 'foo', title: 'Open new tab'},
          // {action: 'bar', title: 'Focus last'},
          {action: 'baz', title: 'Navigate last'},
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

  /*async send(): Promise<SendResult[]> {
    const promises = this.subscribers.map(sub =>
      sendNotification(sub, JSON.stringify({
        notification: {
          title: 'foo',
          body: `bar@${new Date().toISOString()}`,
          icon: 'https://raw.githubusercontent.com/mdn/dom-examples/refs/heads/main/to-do-notifications/img/icon-128.png',
          vibrate: [100, 50, 100],
          actions: [
            {action: 'foo', title: 'Open new tab'},
            // {action: 'bar', title: 'Focus last'},
            {action: 'baz', title: 'Navigate last'},
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
      }))
    );
    console.log(`sending ${promises.length} message(s)...`);
    return Promise.all(promises);
  }*/
}
