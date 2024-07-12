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
      entities: ['**/*.entity{.ts,.js}'],
      migrationsTableName: 'migration',
      migrations: ['src/migration/*.ts'],
      // cli: {
      //   migrationsDir: 'src/migration',
      // },
      ssl: false,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
