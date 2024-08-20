import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { from, Observable } from 'rxjs';
import { Repository } from 'typeorm';
import { EventTypeRevision } from '../model/event-type-revision.entity';
import { CreateEventTypeRevisionDto } from './dto/create-event-type-revision.dto';

@Injectable()
export class EventTypeRevisionService {

  constructor(
    @InjectRepository(EventTypeRevision) private readonly repo: Repository<EventTypeRevision>
  ) {
  }

  create(dto: CreateEventTypeRevisionDto): Observable<unknown> {
    return from(this.repo.save(CreateEventTypeRevisionDto.mapForeignKeys(dto)));
  }
}
