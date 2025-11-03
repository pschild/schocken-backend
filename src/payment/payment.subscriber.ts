import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntitySubscriberInterface, EventSubscriber, UpdateEvent } from 'typeorm';
import { Payment } from '../model/payment.entity';

@Injectable()
@EventSubscriber()
export class PaymentSubscriber implements EntitySubscriberInterface {

  constructor(
    @InjectDataSource() readonly dataSource: DataSource,
  ) {
    dataSource.subscribers.push(this);
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  listenTo(): Function | string {
    return Payment;
  }

  async beforeUpdate(event: UpdateEvent<Payment>): Promise<unknown> {
    const oldValue = event.databaseEntity;
    const newValue = event.entity;

    // handle confirmation (false -> true)
    if (!oldValue.confirmed && newValue.confirmed) {
      newValue.confirmedAt = new Date();

    // handle unconfirmation (true -> false)
    } else if (oldValue.confirmed && !newValue.confirmed) {
      newValue.confirmedAt = null;
      newValue.confirmedBy = null;
    }
    return;
  }
}
