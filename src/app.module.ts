import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5439,
      username: 'root',
      password: 'rootPW',
      database: 'hoptimisten',
      schema: 'hoptimisten',
      entities: ['dist/**/*.entity{.ts,.js}'],
      migrationsTableName: 'migration',
      migrations: ['src/migration/*.ts'],
      // cli: {
      //   migrationsDir: 'src/migration',
      // },
      ssl: false,
      // autoLoadEntities: true,
      // synchronize: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
