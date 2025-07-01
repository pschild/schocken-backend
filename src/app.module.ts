import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guard/jwt-auth.guard';
import { PermissionGuard } from './auth/guard/permission.guard';
import { RoleGuard } from './auth/guard/role.guard';
import { PlayerModule } from './player/player.module';
import { utilities as nestWinstonModuleUtilities, WinstonModule } from 'nest-winston';
import { PushNotificationModule } from './push-notification/push-notification.module';
import { RoundModule } from './round/round.module';
import { GameModule } from './game/game.module';
import { EventModule } from './event/event.module';
import { EventTypeModule } from './event-type/event-type.module';
import { StatisticsModule } from './statistics/statistics.module';
import * as winston from 'winston';
import { UserSettingsModule } from './user-settings/user-settings.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST'),
        port: +configService.get<string>('DATABASE_PORT'),
        username: configService.get<string>('DATABASE_USER'),
        password: configService.get<string>('DATABASE_PASSWORD'),
        database: configService.get<string>('DATABASE_DB'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        // logging: true,
        // logger: 'file',
      }),
      inject: [ConfigService],
    }),
    WinstonModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        transports: [
          new winston.transports.File({
            dirname: `logs`,
            filename: `app.log`,
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
    CacheModule.register({ isGlobal: true }),
    PlayerModule,
    RoundModule,
    GameModule,
    EventModule,
    EventTypeModule,
    StatisticsModule,
    UserModule,
    UserSettingsModule,
    PushNotificationModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RoleGuard,
    }
  ]
})
export class AppModule {}
