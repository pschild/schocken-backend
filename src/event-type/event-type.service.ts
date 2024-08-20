import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { from, Observable, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { Repository } from 'typeorm';
import { ensureExistence } from '../ensure-existence.operator';
import { EventType } from '../model/event-type.entity';
import { CreateEventTypeDto } from './dto/create-event-type.dto';
import { EventTypeDto } from './dto/event-type.dto';
import { UpdateEventTypeDto } from './dto/update-event-type.dto';

@Injectable()
export class EventTypeService {

  constructor(
    @InjectRepository(EventType) private readonly repo: Repository<EventType>
  ) {
  }

  create(dto: CreateEventTypeDto): Observable<EventTypeDto> {
    return from(this.repo.save(CreateEventTypeDto.mapForeignKeys(dto))).pipe(
      switchMap(({ id }) => this.findOne(id)),
    );
  }

  findAll(): Observable<EventTypeDto[]> {
    return from(this.repo.find()).pipe(
      map(EventTypeDto.fromEntities)
    );
  }

  findOne(id: string): Observable<EventTypeDto> {
    return from(this.repo.findOneBy({ id })).pipe(
      map(EventTypeDto.fromEntity)
    );
  }

  update(id: string, dto: UpdateEventTypeDto): Observable<EventTypeDto> {
    return from(this.repo.preload({ id, ...UpdateEventTypeDto.mapForeignKeys(dto) })).pipe(
      ensureExistence(),
      switchMap(entity => from(this.repo.save(entity))),
      switchMap(() => this.findOne(id)),
    );
  }

  remove(id: string): Observable<string> {
    return from(this.repo.findOneByOrFail({ id })).pipe(
      // use softRemove over softDelete so that subscriber's hook `afterSoftRemove` is called
      switchMap(entity => from(this.repo.softRemove(entity))), // SOFT remove!
      map(() => id)
    );
  }
}
