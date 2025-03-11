import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ManagementClient } from 'auth0';

@Injectable()
export class Auth0ClientService {

  private readonly _managementClient: ManagementClient;

  constructor(configService: ConfigService) {
    this._managementClient = new ManagementClient({
      domain: configService.get<string>('AUTH0_CLIENT_DOMAIN'),
      clientId: configService.get<string>('AUTH0_CLIENT_CLIENT_ID'),
      clientSecret: configService.get<string>('AUTH0_CLIENT_CLIENT_SECRET'),
      audience: configService.get<string>('AUTH0_CLIENT_AUDIENCE'),
    });
  }

  public get managementClient(): ManagementClient {
    return this._managementClient;
  }
}
