import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from '../model/payment.entity';
import { PlayerModule } from '../player/player.module';
import { StatisticsModule } from '../statistics/statistics.module';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PaymentSubscriber } from './payment.subscriber';

@Module({
  imports: [TypeOrmModule.forFeature([Payment]), StatisticsModule, PlayerModule],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentSubscriber],
  exports: [PaymentService],
})
export class PaymentModule {}
