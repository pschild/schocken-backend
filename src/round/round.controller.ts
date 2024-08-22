import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { Observable } from 'rxjs';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { RoundDto } from './dto/round.dto';
import { RoundService } from './round.service';
import { CreateRoundDto } from './dto/create-round.dto';
import { UpdateRoundDto } from './dto/update-round.dto';

@Controller('round')
export class RoundController {
  constructor(private readonly service: RoundService) {}

  @Post()
  create(@Body() dto: CreateRoundDto): Observable<RoundDto> {
    return this.service.create(dto);
  }

  @Get()
  findAll(): Observable<RoundDto[]> {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Observable<RoundDto> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRoundDto): Observable<RoundDto> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Observable<string> {
    return this.service.remove(id);
  }

  @Patch(':id/attendees')
  updateAttendees(@Param('id') id: string, @Body() dto: UpdateAttendanceDto): Observable<RoundDto> {
    return this.service.updateAttendees(id, dto);
  }

  @Patch(':roundId/finalists/:playerId')
  addFinalist(
    @Param('roundId') roundId: string,
    @Param('playerId') playerId: string,
  ): Observable<RoundDto> {
    return this.service.addFinalist(roundId, playerId);
  }

  @Delete(':roundId/finalists/:playerId')
  removeFinalist(
    @Param('roundId') roundId: string,
    @Param('playerId') playerId: string,
  ): Observable<RoundDto> {
    return this.service.removeFinalist(roundId, playerId);
  }

}
