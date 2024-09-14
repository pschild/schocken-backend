import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { defaultIfEmpty, filter, forkJoin, from, Observable, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { Repository } from 'typeorm';
import { CelebrationDto, isCelebration } from '../celebration';
import { ensureExistence } from '../ensure-existence.operator';
import { Round } from '../model/round.entity';
import { CreateRoundDto } from './dto/create-round.dto';
import { CreateRoundResponse } from './dto/create-round.response';
import { RoundDetailDto } from './dto/round-detail.dto';
import { RoundDto } from './dto/round.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { UpdateRoundDto } from './dto/update-round.dto';

@Injectable()
export class RoundService {

  constructor(
    @InjectRepository(Round) private readonly repo: Repository<Round>
  ) {
  }

  create(dto: CreateRoundDto): Observable<CreateRoundResponse> {
    return from(this.repo.save(CreateRoundDto.mapForeignKeys(dto))).pipe(
      switchMap(({ id }) => forkJoin({ round: this.findOne(id), celebration: this.getCelebration() })),
    );
  }

  private getCelebration(): Observable<CelebrationDto> {
    // TODO: falls Performance-Probleme auftauchen: Abfrage mit *allen* counts machen und diese fuer x Minuten Cachen
    return from(this.repo.count()).pipe(
      filter(count => isCelebration(count)),
      map(count => ({ label: 'Runden', count })),
      defaultIfEmpty(null),
    );
  }

  findAll(): Observable<RoundDto[]> {
    return from(this.repo.find()).pipe(
      map(RoundDto.fromEntities)
    );
  }

  findOne(id: string): Observable<RoundDto> {
    return from(this.repo.findOneOrFail({ where: { id }, relations: ['game', 'attendees', 'finalists'], withDeleted: true })).pipe(
      map(RoundDto.fromEntity)
    );
  }

  getDetails(id: string): Observable<RoundDetailDto> {
    return from(this.repo.findOne({ where: { id }, relations: ['events', 'events.player', 'events.eventType', 'attendees', 'finalists'], withDeleted: true })).pipe(
      map(RoundDetailDto.fromEntity)
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
