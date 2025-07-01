import { Body, Controller, ForbiddenException, Get, Param, Post } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import { User } from '../auth/model/user.model';
import { UpdateUserSettingsDto } from './dto/update-user-settings.dto';
import { UserSettingsDto } from './dto/user-settings.dto';
import { UserSettingsService } from './user-settings.service';

@ApiTags('user-settings')
@Controller('user-settings')
export class UserSettingsController {

  constructor(
    private service: UserSettingsService
  ) {
  }

  @Post()
  @ApiBody({ type: UpdateUserSettingsDto })
  @ApiCreatedResponse({ type: UserSettingsDto })
  createOrUpdate(@Body() dto: UpdateUserSettingsDto, @CurrentUser() user: User): Observable<UserSettingsDto> {
    if (dto.auth0UserId !== user.userId) {
      throw new ForbiddenException(`User ${user.userId} has no permission to access settings for user ${dto.auth0UserId}`);
    }

    return this.service.createOrUpdate(dto).pipe(
      map(UserSettingsDto.fromEntity),
    );
  }

  @Get(':userId')
  @ApiOkResponse({ type: UserSettingsDto })
  findByUserId(@Param('userId') userId: string, @CurrentUser() user: User): Observable<UserSettingsDto> {
    if (userId !== user.userId) {
      throw new ForbiddenException(`User ${user.userId} has no permission to access settings for user ${userId}`);
    }

    return this.service.findByUserId(userId).pipe(
      map(UserSettingsDto.fromEntity)
    );
  }
}
