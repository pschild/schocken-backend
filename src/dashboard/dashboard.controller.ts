import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiProperty, ApiTags } from '@nestjs/swagger';
import { from, Observable, switchMap } from 'rxjs';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import { Permissions } from '../auth/decorator/permission.decorator';
import { Permission } from '../auth/model/permission.enum';
import { User } from '../auth/model/user.model';
import { PlayerService } from '../player/player.service';
import { EventTypeStreakDto, StreakDto } from '../statistics/dto';
import { DashboardService } from './dashboard.service';

export class DashboardStreaksResponseDto {

  @ApiProperty({ type: [EventTypeStreakDto] })
  noEventTypeStreaks: EventTypeStreakDto[];

  @ApiProperty({ type: [EventTypeStreakDto] })
  eventTypeStreaks: EventTypeStreakDto[];

  @ApiProperty({ type: [StreakDto] })
  noPenaltyStreaks: StreakDto[];

  @ApiProperty({ type: [StreakDto] })
  penaltyStreaks: StreakDto[];

  @ApiProperty({ type: [StreakDto] })
  attendanceStreaks: StreakDto[];

}

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly playerService: PlayerService,
  ) {}

  @Get()
  @Permissions([Permission.READ_STATISTICS])
  @ApiOkResponse({ type: DashboardStreaksResponseDto })
  getCurrentStreaksByUser(@CurrentUser() user: User): Observable<DashboardStreaksResponseDto> {
    return this.playerService.getPlayerByUserId(user.userId).pipe(
      switchMap(({ id }) => from(this.dashboardService.getCurrentStreaksByUser(id))),
    );
  }
}
