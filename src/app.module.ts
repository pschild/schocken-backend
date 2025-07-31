import { CacheModule } from '@nestjs/cache-manager';
import { Inject, Module, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { utilities as nestWinstonModuleUtilities, WINSTON_MODULE_PROVIDER, WinstonModule } from 'nest-winston';
import { defaultIfEmpty, forkJoin, switchMap } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import * as winston from 'winston';
import { Logger } from 'winston';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guard/jwt-auth.guard';
import { PermissionGuard } from './auth/guard/permission.guard';
import { RoleGuard } from './auth/guard/role.guard';
import { DashboardModule } from './dashboard/dashboard.module';
import { EventTypeModule } from './event-type/event-type.module';
import { EventModule } from './event/event.module';
import { GameDetailService } from './game/game-detail.service';
import { GameModule } from './game/game.module';
import { PaymentModule } from './payment/payment.module';
import { PaymentService } from './payment/payment.service';
import { PlayerModule } from './player/player.module';
import { RoundModule } from './round/round.module';
import { StatisticsModule } from './statistics/statistics.module';
import { UserModule } from './user/user.module';
import { WhatsAppModule } from './whats-app/whats-app.module';

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
    WhatsAppModule,
    PaymentModule,
    DashboardModule,
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
export class AppModule implements OnApplicationBootstrap {

  constructor(
    private readonly gameDetailService: GameDetailService,
    private readonly paymentService: PaymentService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
  }

  onApplicationBootstrap() {
    /**
     * The following code creates new payments for all games, if payments not already exist.
     * TODO: remove this code as soon as payments are created in prod. This is a one-time-only migration!
     */
    forkJoin([this.gameDetailService.findAll(), this.paymentService.countAll()]).pipe(
      filter(([games, paymentCount]) => games.length > 0 && paymentCount === 0),
      map(([games, _]) => games.map(game => game.id)),
      switchMap(gameIds => forkJoin(gameIds.map(gameId => this.paymentService.apply(gameId)))),
      map(insertResults => insertResults.flat()),
      switchMap(payments => forkJoin(payments.map(payment =>
        this.paymentService.update(payment.id, { outstandingValue: 0, confirmed: true })))
      ),
      defaultIfEmpty([]),
    ).subscribe(affected => this.logger.info(`Inserted ${affected.length} payments`));
  }
}
