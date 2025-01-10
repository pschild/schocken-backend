import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { defaultIfEmpty, filter, forkJoin, from, iif, Observable, of, switchMap, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { Repository } from 'typeorm';
import { CelebrationDto, isCelebration } from '../celebration';
import { ensureExistence } from '../ensure-existence.operator';
import { Round } from '../model/round.entity';
import { CreateRoundDto } from './dto/create-round.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { UpdateFinalistsDto } from './dto/update-finalists.dto';

@Injectable()
export class RoundDetailService {

  constructor(
    @InjectRepository(Round) private readonly repo: Repository<Round>
  ) {
  }

  create(dto: CreateRoundDto): Observable<{ round: Round; celebration: CelebrationDto }> {
    return iif(
      () => !!dto.attendees?.length,
      of(dto.attendees),
      this.getAttendeeIdsOfLatestRound(dto.gameId)
    ).pipe(
      switchMap(atendeeIds => {
        return from(this.repo.save(CreateRoundDto.mapForeignKeys({
          ...dto,
          attendees: atendeeIds
        })));
      }),
      switchMap(({ id }) => forkJoin({ round: this.findOne(id), celebration: this.getCelebration() })),
    );
  }

  private getAttendeeIdsOfLatestRound(gameId: string): Observable<string[]> {
    return from(this.repo.findOne({
      select: { attendees: { id: true } },
      where: { game: { id: gameId } },
      order: { datetime: 'DESC' },
      relations: ['attendees']
    })).pipe(
      map(round => !!round ? round.attendees.map(attendee => attendee.id) : []),
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

  findOne(id: string): Observable<Round> {
    return from(this.repo.findOneOrFail({
      where: { id },
      relations: ['game', 'attendees', 'finalists'],
      withDeleted: true
    }));
  }

  getGameDatetime(id: string): Observable<Date> {
    return from(this.repo.findOne({
      select: { game: { datetime: true } },
      where: { id },
      relations: ['game']
    })).pipe(
      ensureExistence(),
      map(round => round.game.datetime),
    );
  }

  findByGameId(gameId: string): Observable<Round[]> {
    return from(this.repo.find({
      where: { game: { id: gameId } },
      order: { datetime: 'ASC', events: { datetime: 'ASC' } },
      relations: ['events', 'events.player', 'events.eventType', 'attendees', 'finalists'],
      withDeleted: true
    }));
  }

  getDetails(id: string): Observable<Round> {
    return from(this.repo.findOne({
      where: { id },
      relations: ['events', 'events.player', 'events.eventType', 'attendees', 'finalists'],
      order: { events: { datetime: 'ASC' } },
      withDeleted: true
    }));
  }

  updateAttendees(roundId: string, dto: UpdateAttendanceDto): Observable<Round> {
    return from(this.repo.findOneOrFail({ where: { id: roundId }, relations: ['attendees'] })).pipe(
      // Workaround: set lastChangedDateTime manually in order to execute the RoundSubscriber beforeUpdate, see https://github.com/typeorm/typeorm/issues/9090
      map(round => ({ ...round, attendees: dto.playerIds.map(id => ({ id })), lastChangedDateTime: new Date() })),
      switchMap(round => this.repo.save(round)),
      switchMap(({ id }) => this.getDetails(id)),
    );
  }

  updateFinalists(roundId: string, dto: UpdateFinalistsDto): Observable<Round> {
    return from(this.repo.findOneOrFail({ where: { id: roundId }, relations: ['finalists'] })).pipe(
      // Workaround: set lastChangedDateTime manually in order to execute the RoundSubscriber beforeUpdate, see https://github.com/typeorm/typeorm/issues/9090
      map(round => ({ ...round, finalists: dto.playerIds.map(id => ({ id })), lastChangedDateTime: new Date() })),
      switchMap(round => this.repo.save(round)),
      switchMap(({ id }) => this.getDetails(id)),
    );
  }

  remove(id: string): Observable<string> {
    return from(this.repo.findOneByOrFail({ id })).pipe(
      switchMap(entity => from(this.repo.remove(entity))),
      map(() => id)
    );
  }
}
