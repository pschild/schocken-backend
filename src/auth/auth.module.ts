import { Module } from '@nestjs/common';
import { Auth0ClientService } from './auth0-client.service';
import { JwtStrategy } from './jwt.strategy';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    PassportModule
  ],
  providers: [Auth0ClientService, JwtStrategy],
  exports: [Auth0ClientService]
})
export class AuthModule {}
