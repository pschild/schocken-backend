import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { from, Observable, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { Repository } from 'typeorm';
import { ensureExistence } from '../ensure-existence.operator';
import { Round } from '../model/round.entity';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { CreateRoundDto } from './dto/create-round.dto';
import { RoundDto } from './dto/round.dto';
import { UpdateRoundDto } from './dto/update-round.dto';

@Injectable()
export class RoundService {

  constructor(
    @InjectRepository(Round) private readonly repo: Repository<Round>
  ) {
  }

  create(dto: CreateRoundDto): Observable<RoundDto> {
    return from(this.repo.save(CreateRoundDto.mapForeignKeys(dto))).pipe(
      switchMap(({ id }) => this.findOne(id)),
    );
  }

  findAll(): Observable<RoundDto[]> {
    return from(this.repo.find()).pipe(
      map(RoundDto.fromEntities)
    );
  }

  findOne(id: string): Observable<RoundDto> {
    return from(this.repo.findOne({ where: { id }, relations: ['game', 'attendees', 'finalists'] })).pipe(
      map(RoundDto.fromEntity)
    );
  }

  update(id: string, dto: UpdateRoundDto): Observable<RoundDto> {
    return from(this.repo.preload({ id, ...UpdateRoundDto.mapForeignKeys(dto) })).pipe(
      ensureExistence(),
      switchMap(entity => from(this.repo.save(entity))),
      switchMap(() => this.findOne(id)),
    );
  }

  remove(id: string): Observable<string> {
    return from(this.repo.findOneByOrFail({ id })).pipe(
      switchMap(entity => from(this.repo.remove(entity))),
      map(() => id)
    );
  }

  updateAttendees(roundId: string, dto: UpdateAttendanceDto): Observable<RoundDto> {
    return from(this.repo.findOne({ where: { id: roundId }, relations: ['attendees'] })).pipe(
      map(round => ({ ...round, attendees: dto.playerIds.map(id => ({ id })) })),
      switchMap(round => this.repo.save(round)),
      switchMap(({ id }) => this.findOne(id)),
    );
  }

  addFinalist(roundId: string, playerId: string): Observable<RoundDto> {
    return from(this.repo.findOne({ where: { id: roundId }, relations: ['finalists'] })).pipe(
      map(round => ({ ...round, finalists: [...round.finalists, { id: playerId }] })),
      switchMap(round => this.repo.save(round)),
      switchMap(({ id }) => this.findOne(id)),
    );
  }

  removeFinalist(roundId: string, playerId: string): Observable<RoundDto> {
    return from(this.repo.findOne({ where: { id: roundId }, relations: ['finalists'] })).pipe(
      map(round => ({ ...round, finalists: round.finalists.filter(player => player.id !== playerId) })),
      switchMap(round => this.repo.save(round)),
      switchMap(({ id }) => this.findOne(id)),
    );
  }
}
