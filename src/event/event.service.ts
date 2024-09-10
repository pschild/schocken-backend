import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { from, Observable, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { Repository } from 'typeorm';
import { ensureExistence } from '../ensure-existence.operator';
import { EventTypeService } from '../event-type/event-type.service';
import { Event } from '../model/event.entity';
import { Game } from '../model/game.entity';
import { Round } from '../model/round.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { EventWithWarningDto } from './dto/event-with-warning.dto';
import { EventDto } from './dto/event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventContext } from './enum/event-context.enum';

@Injectable()
export class EventService {

  constructor(
    @InjectRepository(Event) private readonly repo: Repository<Event>,
    @InjectRepository(Game) private readonly gameRepo: Repository<Game>,
    @InjectRepository(Round) private readonly roundRepo: Repository<Round>,
    private readonly eventTypeService: EventTypeService
  ) {
  }

  create(dto: CreateEventDto): Observable<EventWithWarningDto> {
    const referenceDate$ = dto.context === EventContext.GAME
      ? from(this.gameRepo.findOneOrFail({ where: { id: dto.gameId } })).pipe(map(game => game.datetime))
      : from(this.roundRepo.findOneOrFail({ where: { id: dto.roundId }, relations: ['game'] })).pipe(map(round => round.game.datetime));

    return referenceDate$.pipe(
      switchMap(referenceDate => this.eventTypeService.findValidPenalty(dto.eventTypeId, dto.context, referenceDate)),
      switchMap(({ penaltyValue, penaltyUnit, warning }) => {
        return from(this.repo.save({ ...CreateEventDto.mapForeignKeys(dto), penaltyValue, penaltyUnit })).pipe(
          switchMap(({ id }) => this.findOne(id)),
          map(entity => ({ entity, warning })),
        );
      })
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
