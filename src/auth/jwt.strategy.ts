import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { passportJwtSecret } from 'jwks-rsa';
import { User } from './model/user.model';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {

  constructor(configService: ConfigService) {
    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${configService.get<string>('AUTH0_DOMAIN')}.well-known/jwks.json`,
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      issuer: configService.get<string>('AUTH0_DOMAIN'),
      audience: configService.get<string>('AUTH0_AUDIENCE'),
      algorithms: ['RS256'],
    });
  }

  async validate(payload: { sub: string; permissions: string[]; ['hoptimisten/roles']: string[]; }): Promise<User> {
    return { userId: payload.sub, permissions: payload.permissions, roles: payload['hoptimisten/roles'] };
  }
}
