import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { format } from 'date-fns';
import { from, iif, Observable, of, switchMap, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { Not, Repository } from 'typeorm';
import { ensureExistence } from '../ensure-existence.operator';
import { EventContext } from '../event/enum/event-context.enum';
import { EventType } from '../model/event-type.entity';
import { Event } from '../model/event.entity';
import { PenaltyUnit } from '../penalty/enum/penalty-unit.enum';
import { CreateEventTypeDto } from './dto/create-event-type.dto';
import { EventTypeOverviewDto } from './dto/event-type-overview.dto';
import { EventTypeRevisionDto } from './dto/event-type-revision.dto';
import { EventTypeDto } from './dto/event-type.dto';
import { UpdateEventTypeDto } from './dto/update-event-type.dto';
import { EventTypeContext } from './enum/event-type-context.enum';
import { DuplicateEventTypeNameException } from './exception/duplicate-event-type-name.exception';
import { findValidAt } from './util/event-type-revision.utils';

@Injectable()
export class EventTypeService {

  constructor(
    @InjectRepository(EventType) private readonly repo: Repository<EventType>
  ) {
  }

  create(dto: CreateEventTypeDto): Observable<EventTypeDto> {
    return from(this.repo.findOneBy({ description: dto.description })).pipe(
      switchMap(found => found
        ? throwError(() => new DuplicateEventTypeNameException())
        : from(this.repo.save(CreateEventTypeDto.mapForeignKeys(dto)))
      ),
      switchMap(({ id }) => this.findOne(id)),
    );
  }

  findAll(): Observable<EventTypeDto[]> {
    return from(this.repo.find()).pipe(
      map(EventTypeDto.fromEntities)
    );
  }

  /**
   * Queries all event types by given context and sorts them by their frequency.
   * @param context
   */
  getOverviewByContext(context: EventTypeContext): Observable<EventTypeOverviewDto[]> {
    return from(
      this.repo.createQueryBuilder('et')
        .select(['et.*', 'COUNT(e.id) as count'])
        .where({ context })
        .leftJoin(Event, 'e', 'e.eventTypeId = et.id')
        .groupBy('et.id')
        .addGroupBy('et.description')
        .orderBy('count', 'DESC')
        .addOrderBy('et.description', 'ASC')
        .getRawMany<EventType & { count: number }>()
    ).pipe(
      map(EventTypeOverviewDto.fromEntities)
    );
  }

  findOne(id: string): Observable<EventTypeDto> {
    return from(this.repo.findOne({ where: { id }, relations: ['revisions'] })).pipe(
      map(EventTypeDto.fromEntity)
    );
  }

  findValidPenalty(eventTypeId: string, context: EventContext, referenceDate: Date): Observable<{ penaltyValue: number; penaltyUnit: PenaltyUnit; warning?: string }> {
    return from(this.repo.findOne({ where: { id: eventTypeId, context: EventTypeContext[context.valueOf()] }, relations: ['revisions'] })).pipe(
      map(EventTypeDto.fromEntity),
      ensureExistence<EventTypeDto>(`Could not find event type with id '${eventTypeId}' and context '${context}'`),
      map(eventType => ({
        current: eventType,
        revision: findValidAt(eventType.revisions, referenceDate),
      })),
      map(({ current, revision }) => {
        return this.penaltyIsOutdated(current, revision)
          ? { penaltyValue: revision.penaltyValue, penaltyUnit: revision.penaltyUnit, warning: `Penalty valid at ${format(referenceDate, 'dd.MM.yyyy HH:mm:ss')}: ${revision.penaltyValue} ${revision.penaltyUnit}, penalty valid now: ${current.penaltyValue} ${current.penaltyUnit}` }
          : { penaltyValue: current.penaltyValue, penaltyUnit: current.penaltyUnit };
      }),
    );
  }

  private penaltyIsOutdated(currentEntity: EventTypeDto, revision: EventTypeRevisionDto): boolean {
    return revision && (currentEntity.penaltyValue !== revision.penaltyValue || currentEntity.penaltyUnit !== revision.penaltyUnit);
  }

  update(id: string, dto: UpdateEventTypeDto): Observable<EventTypeDto> {
    // If `description` is provided, try to find an existing entity with this value and a _different_ id.
    // If found, we need to throw DuplicateException.
    const findByUniqueValue$ = iif(
      () => !!dto.description,
      from(this.repo.findOne({ where: { id: Not(id), description: dto.description } })),
      of(false)
    );

    return findByUniqueValue$.pipe(
      switchMap(found => found
        ? throwError(() => new DuplicateEventTypeNameException())
        : from(this.repo.preload({ id, ...UpdateEventTypeDto.mapForeignKeys(dto) }))
      ),
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
