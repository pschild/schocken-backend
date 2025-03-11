import { Controller, Get, Inject } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Logger } from 'winston';
import { Auth0ClientService } from '../auth/auth0-client.service';
import { Roles } from '../auth/decorator/role.decorator';
import { Role } from '../auth/model/role.enum';
import { UserDto } from './dto/user.dto';

@ApiTags('user')
@Controller('user')
export class UserController {

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private service: Auth0ClientService
  ) {
  }

  @Get()
  @Roles([Role.ADMIN])
  @ApiOkResponse({ type: [UserDto] })
  public findAllIds(): Observable<UserDto[]> {
    return from(this.service.managementClient.users.getAll()).pipe(
      map(response => response.data),
      map(UserDto.fromEntities)
    );
  }
}
