import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { from, Observable, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { Repository } from 'typeorm';
import { ensureExistence } from '../ensure-existence.operator';
import { EventTypeDto } from '../event-type/dto/event-type.dto';
import { EventTypeService } from '../event-type/event-type.service';
import { Event } from '../model/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { EventDto } from './dto/event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventService {

  constructor(
    @InjectRepository(Event) private readonly repo: Repository<Event>,
    private readonly eventTypeService: EventTypeService
  ) {
  }

  create(dto: CreateEventDto): Observable<EventDto> {
    return this.eventTypeService.findOne(dto.eventTypeId).pipe(
      ensureExistence<EventTypeDto>(`Could not find event type with id '${dto.eventTypeId}'`),
      switchMap(eventType => from(this.repo.save({
        ...CreateEventDto.mapForeignKeys(dto),
        penaltyValue: eventType.penaltyValue,
        penaltyUnit: eventType.penaltyUnit,
      }))),
      switchMap(({ id }) => this.findOne(id)),
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
