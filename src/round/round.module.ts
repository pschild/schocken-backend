import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Round } from '../model/round.entity';
import { RoundDetailController } from './round-detail.controller';
import { RoundDetailService } from './round-detail.service';
import { RoundSubscriber } from './round.subscriber';

@Module({
  imports: [TypeOrmModule.forFeature([Round])],
  controllers: [RoundDetailController],
  providers: [RoundDetailService, RoundSubscriber],
  exports: [RoundDetailService]
})
export class RoundModule {}
