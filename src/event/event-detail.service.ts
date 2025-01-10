import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { concat, defaultIfEmpty, filter, forkJoin, from, Observable, switchMap, toArray } from 'rxjs';
import { map } from 'rxjs/operators';
import { Repository } from 'typeorm';
import { CelebrationDto, isCelebration } from '../celebration';
import { EventTypeService } from '../event-type/event-type.service';
import { GameDetailService } from '../game/game-detail.service';
import { Event } from '../model/event.entity';
import { RoundDetailService } from '../round/round-detail.service';
import { BulkCreateEventsDto } from './dto/bulk-create-events.dto';
import { CreateEventDto } from './dto/create-event.dto';
import { EventContext } from './enum/event-context.enum';

@Injectable()
export class EventDetailService {

  constructor(
    @InjectRepository(Event) private readonly repo: Repository<Event>,
    private readonly gameDetailService: GameDetailService,
    private readonly roundDetailService: RoundDetailService,
    private readonly eventTypeService: EventTypeService
  ) {
  }

  create(dto: CreateEventDto): Observable<{ event: Event; celebration?: CelebrationDto; warning?: string }> {
    const referenceDate$ = dto.context === EventContext.GAME
      ? this.gameDetailService.getDatetime(dto.gameId).pipe(map(datetime => datetime.toISOString()))
      : this.roundDetailService.getGameDatetime(dto.roundId).pipe(map(datetime => datetime.toISOString()));

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

  private countByEventTypeId(eventTypeId: string): Observable<number> {
    return from(this.repo.countBy({ eventType: { id: eventTypeId } }));
  }

  private findOne(id: string): Observable<Event> {
    return from(this.repo.findOne({ where: { id }, relations: ['player', 'eventType'], withDeleted: true }));
  }

  bulkCreate(dto: BulkCreateEventsDto): Observable<{ event: Event; celebration?: CelebrationDto; warning?: string }[]> {
    const { datetime, context, gameId, roundId, eventTypeId, playerIds } = dto;
    // Important: use concat instead of forkJoin to avoid transaction problems :-(
    return concat(...playerIds.map(playerId => this.create({
      playerId,
      context,
      roundId,
      gameId,
      eventTypeId,
      datetime,
    }))).pipe(
      toArray()
    );
  }

  remove(id: string): Observable<string> {
    return from(this.repo.findOneByOrFail({ id })).pipe(
      switchMap(entity => from(this.repo.remove(entity))),
      map(() => id)
    );
  }
}
