import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Round } from '../model/round.entity';
import { RoundService } from './round.service';
import { RoundController } from './round.controller';
import { RoundSubscriber } from './round.subscriber';

@Module({
  imports: [TypeOrmModule.forFeature([Round])],
  controllers: [RoundController],
  providers: [RoundService, RoundSubscriber],
  exports: [RoundService]
})
export class RoundModule {}
