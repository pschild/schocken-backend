import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { Observable } from 'rxjs';
import { RoundDto } from './dto/round.dto';
import { RoundService } from './round.service';
import { CreateRoundDto } from './dto/create-round.dto';
import { UpdateRoundDto } from './dto/update-round.dto';

@Controller('round')
export class RoundController {
  constructor(private readonly service: RoundService) {}

  @Post()
  create(@Body() createRoundDto: CreateRoundDto): Observable<RoundDto> {
    return this.service.create(createRoundDto);
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
  update(@Param('id') id: string, @Body() updateRoundDto: UpdateRoundDto): Observable<RoundDto> {
    return this.service.update(id, updateRoundDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Observable<string> {
    return this.service.remove(id);
  }

  @Patch(':roundId/attendees/:playerId')
  addAttendance(
    @Param('roundId') roundId: string,
    @Param('playerId') playerId: string,
  ): Observable<RoundDto> {
    return this.service.addAttendee(roundId, playerId);
  }

  @Delete(':roundId/attendees/:playerId')
  removeAttendance(
    @Param('roundId') roundId: string,
    @Param('playerId') playerId: string,
  ): Observable<RoundDto> {
    return this.service.removeAttendee(roundId, playerId);
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
