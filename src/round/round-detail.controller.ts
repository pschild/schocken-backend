import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiProduces, ApiTags } from '@nestjs/swagger';
import { Observable, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { Permissions } from '../auth/decorator/permission.decorator';
import { Permission } from '../auth/model/permission.enum';
import { CreateDetailRoundResponse } from './dto/create-detail-round.response';
import { CreateRoundDto } from './dto/create-round.dto';
import { RoundDetailDto } from './dto/round-detail.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { UpdateFinalistsDto } from './dto/update-finalists.dto';
import { RoundDetailService } from './round-detail.service';

@ApiTags('round-details')
@Controller('round-details')
export class RoundDetailController {
  constructor(private readonly service: RoundDetailService) {}

  @Post()
  @Permissions([Permission.CREATE_ROUNDS])
  @ApiBody({ type: CreateRoundDto })
  @ApiCreatedResponse({ type: CreateDetailRoundResponse })
  create(@Body() dto: CreateRoundDto): Observable<CreateDetailRoundResponse> {
    return this.service.create(dto).pipe(
      switchMap(response => this.service.getDetails(response.round.id).pipe(
        map(round => ({ ...response, round: RoundDetailDto.fromEntity(round) }))
      )),
    );
  }

  @Get(':gameId')
  @Permissions([Permission.READ_ROUNDS, Permission.READ_GAMES])
  @ApiOkResponse({ type: [RoundDetailDto] })
  getByGameId(@Param('gameId') gameId: string): Observable<RoundDetailDto[]> {
    return this.service.findByGameId(gameId).pipe(
      map(RoundDetailDto.fromEntities)
    );
  }

  @Get(':id/details')
  @Permissions([Permission.READ_ROUNDS])
  @ApiOkResponse({ type: RoundDetailDto })
  getDetails(@Param('id') id: string): Observable<RoundDetailDto> {
    return this.service.getDetails(id).pipe(
      map(RoundDetailDto.fromEntity)
    );
  }

  @Patch(':id/attendees')
  @Permissions([Permission.UPDATE_ROUNDS])
  @ApiOkResponse({ type: RoundDetailDto })
  updateAttendees(@Param('id') id: string, @Body() dto: UpdateAttendanceDto): Observable<RoundDetailDto> {
    return this.service.updateAttendees(id, dto).pipe(
      map(RoundDetailDto.fromEntity)
    );
  }

  @Patch(':id/finalists')
  @Permissions([Permission.UPDATE_ROUNDS])
  @ApiOkResponse({ type: RoundDetailDto })
  updateFinalists(@Param('id') id: string, @Body() dto: UpdateFinalistsDto): Observable<RoundDetailDto> {
    return this.service.updateFinalists(id, dto).pipe(
      map(RoundDetailDto.fromEntity)
    );
  }

  @Delete(':id')
  @Permissions([Permission.DELETE_ROUNDS])
  @ApiOkResponse({ type: String })
  @ApiProduces('text/plain')
  remove(@Param('id') id: string): Observable<string> {
    return this.service.remove(id);
  }

}
