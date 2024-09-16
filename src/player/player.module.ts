import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Player } from '../model/player.entity';
import { PlayerController } from './player.controller';
import { PlayerService } from './player.service';
import { PlayerSubscriber } from './player.subscriber';

@Module({
  imports: [TypeOrmModule.forFeature([Player])],
  providers: [PlayerService, PlayerSubscriber],
  controllers: [PlayerController],
})
export class PlayerModule {}
