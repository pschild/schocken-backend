import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { from, Observable, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { Repository } from 'typeorm';
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
    return from(this.repo.save(dto)).pipe(
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
    return from(this.repo.update(id, dto)).pipe(
      switchMap(() => this.findOne(id)),
    );
  }

  remove(id: string): Observable<string> {
    // SOFT delete!
    return from(this.repo.softDelete(id)).pipe(
      map(() => id)
    );
  }
}
