import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PlayerModule } from './player/player.module';
import { utilities as nestWinstonModuleUtilities, WinstonModule } from 'nest-winston';
import { RoundModule } from './round/round.module';
import { GameModule } from './game/game.module';
import { GameEventModule } from './game-event/game-event.module';
import { EventTypeModule } from './event-type/event-type.module';
import * as winston from 'winston';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST'),
        port: +configService.get<string>('DATABASE_PORT'),
        username: configService.get<string>('DATABASE_USER'),
        password: configService.get<string>('DATABASE_PASSWORD'),
        database: configService.get<string>('DATABASE_DB'),
        schema: configService.get<string>('DATABASE_SCHEMA'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
      }),
      inject: [ConfigService],
    }),
    WinstonModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        transports: [
          new winston.transports.File({
            filename: `${process.cwd()}/${configService.get('LOG_PATH')}`,
            level: 'error',
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.json(),
            )
          }),
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.timestamp(),
              nestWinstonModuleUtilities.format.nestLike(),
            ),
          }),
        ],
      }),
      inject: [ConfigService],
    }),
    PlayerModule,
    RoundModule,
    GameModule,
    GameEventModule,
    EventTypeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
