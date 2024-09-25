import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiProduces, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { CreateRoundDto } from './dto/create-round.dto';
import { CreateRoundResponse } from './dto/create-round.response';
import { RoundDetailDto } from './dto/round-detail.dto';
import { RoundDto } from './dto/round.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { UpdateRoundDto } from './dto/update-round.dto';
import { RoundService } from './round.service';

@ApiTags('round')
@Controller('round')
export class RoundController {
  constructor(private readonly service: RoundService) {}

  @Post()
  @ApiBody({ type: CreateRoundDto })
  @ApiCreatedResponse({ type: CreateRoundResponse })
  create(@Body() dto: CreateRoundDto): Observable<CreateRoundResponse> {
    return this.service.create(dto);
  }

  @Get()
  @ApiOkResponse({ type: [RoundDto] })
  findAll(): Observable<RoundDto[]> {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOkResponse({ type: RoundDto })
  findOne(@Param('id') id: string): Observable<RoundDto> {
    return this.service.findOne(id);
  }

  @Get(':id/details')
  @ApiOkResponse({ type: RoundDetailDto })
  getDetails(@Param('id') id: string): Observable<RoundDetailDto> {
    return this.service.getDetails(id);
  }

  @Patch(':id')
  @ApiOkResponse({ type: RoundDto })
  update(@Param('id') id: string, @Body() dto: UpdateRoundDto): Observable<RoundDto> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOkResponse({ type: String })
  @ApiProduces('text/plain')
  remove(@Param('id') id: string): Observable<string> {
    return this.service.remove(id);
  }

  @Patch(':id/attendees')
  @ApiOkResponse({ type: RoundDto })
  updateAttendees(@Param('id') id: string, @Body() dto: UpdateAttendanceDto): Observable<RoundDto> {
    return this.service.updateAttendees(id, dto);
  }

  @Patch(':roundId/finalists/:playerId')
  @ApiOkResponse({ type: RoundDto })
  addFinalist(
    @Param('roundId') roundId: string,
    @Param('playerId') playerId: string,
  ): Observable<RoundDto> {
    return this.service.addFinalist(roundId, playerId);
  }

  @Delete(':roundId/finalists/:playerId')
  @ApiOkResponse({ type: RoundDto })
  removeFinalist(
    @Param('roundId') roundId: string,
    @Param('playerId') playerId: string,
  ): Observable<RoundDto> {
    return this.service.removeFinalist(roundId, playerId);
  }

}
