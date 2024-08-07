import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { from, Observable, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { Repository } from 'typeorm';
import { Round } from '../model/round.entity';
import { CreateRoundDto } from './dto/create-round.dto';
import { RoundDto } from './dto/round.dto';
import { UpdateRoundDto } from './dto/update-round.dto';

@Injectable()
export class RoundService {

  constructor(
    @InjectRepository(Round) private readonly repo: Repository<Round>
  ) {
  }

  create(createRoundDto: CreateRoundDto): Observable<RoundDto> {
    return from(this.repo.save(createRoundDto)).pipe(
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

  update(id: string, updateRoundDto: UpdateRoundDto): Observable<RoundDto> {
    return from(this.repo.update(id, updateRoundDto)).pipe(
      switchMap(() => this.findOne(id)),
    );
  }

  remove(id: string): Observable<string> {
    return from(this.repo.delete(id)).pipe(
      map(() => id)
    );
  }

  addAttendee(roundId: string, playerId: string): Observable<RoundDto> {
    return this.addToRelation(roundId, playerId, 'attendees');
  }

  removeAttendee(roundId: string, playerId: string): Observable<RoundDto> {
    return this.removeFromRelation(roundId, playerId, 'attendees');
  }

  addFinalist(roundId: string, playerId: string): Observable<RoundDto> {
    return this.addToRelation(roundId, playerId, 'finalists');
  }

  removeFinalist(roundId: string, playerId: string): Observable<RoundDto> {
    return this.removeFromRelation(roundId, playerId, 'finalists');
  }

  private addToRelation(roundId: string, playerId: string, relation: string): Observable<RoundDto> {
    return from(this.repo.findOne({ where: { id: roundId }, relations: [relation] })).pipe(
      map(round => ({ ...round, [relation]: [...round[relation], { id: playerId }] })),
      switchMap(round => this.repo.save(round)),
      switchMap(({ id }) => this.findOne(id)),
    );
  }

  private removeFromRelation(roundId: string, playerId: string, relation: string): Observable<RoundDto> {
    return from(this.repo.findOne({ where: { id: roundId }, relations: [relation] })).pipe(
      map(round => ({ ...round, [relation]: round[relation].filter(player => player.id !== playerId) })),
      switchMap(round => this.repo.save(round)),
      switchMap(({ id }) => this.findOne(id)),
    );
  }
}
