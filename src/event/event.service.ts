import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { defaultIfEmpty, filter, forkJoin, from, Observable, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { Repository } from 'typeorm';
import { CelebrationDto, isCelebration } from '../celebration';
import { ensureExistence } from '../ensure-existence.operator';
import { EventTypeService } from '../event-type/event-type.service';
import { GameService } from '../game/game.service';
import { Event } from '../model/event.entity';
import { RoundService } from '../round/round.service';
import { CreateEventDto } from './dto/create-event.dto';
import { CreateEventResponse } from './dto/create-event.response';
import { EventDto } from './dto/event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventContext } from './enum/event-context.enum';

@Injectable()
export class EventService {

  constructor(
    @InjectRepository(Event) private readonly repo: Repository<Event>,
    private readonly gameService: GameService,
    private readonly roundService: RoundService,
    private readonly eventTypeService: EventTypeService
  ) {
  }

  create(dto: CreateEventDto): Observable<CreateEventResponse> {
    const referenceDate$ = dto.context === EventContext.GAME
      ? this.gameService.findOne(dto.gameId).pipe(map(game => game.datetime))
      : this.roundService.findOne(dto.roundId).pipe(map(round => round.game.datetime));

    return referenceDate$.pipe(
      switchMap(referenceDate => this.eventTypeService.findValidPenalty(dto.eventTypeId, dto.context, new Date(referenceDate))),
      switchMap(({ penaltyValue, penaltyUnit, warning }) => {
        return from(this.repo.save({ ...CreateEventDto.mapForeignKeys(dto), penaltyValue, penaltyUnit })).pipe(
          switchMap(({ id }) => forkJoin({ event: this.findOne(id), celebration: this.getCelebration(dto.eventTypeId) })),
          map(({ event, celebration }) => ({ event, celebration, warning })),
        );
      })
    );
  }

  private getCelebration(eventTypeId: string): Observable<CelebrationDto> {
    // TODO: falls Performance-Probleme auftauchen: Abfrage mit *allen* counts machen und diese fuer x Minuten Cachen
    return this.countByEventTypeId(eventTypeId).pipe(
      filter(count => isCelebration(count)),
      switchMap(count => this.eventTypeService.findOne(eventTypeId).pipe(
        map(eventType => ({ label: eventType.description, count })),
      )),
      defaultIfEmpty(null),
    );
  }

  findAll(): Observable<EventDto[]> {
    return from(this.repo.find()).pipe(
      map(EventDto.fromEntities)
    );
  }

  findOne(id: string): Observable<EventDto> {
    return from(this.repo.findOne({ where: { id }, relations: ['player', 'eventType'], withDeleted: true })).pipe(
      map(EventDto.fromEntity)
    );
  }

  countByEventTypeId(eventTypeId: string): Observable<number> {
    return from(this.repo.countBy({ eventType: { id: eventTypeId } }));
  }

  update(id: string, dto: UpdateEventDto): Observable<EventDto> {
    return from(this.repo.preload({ id, ...UpdateEventDto.mapForeignKeys(dto) })).pipe(
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
}
