import { Test } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { DataSource, Repository } from 'typeorm';
import { EventTypeRevision } from '../model/event-type-revision.entity';
import { EventType } from '../model/event-type.entity';
import { Event } from '../model/event.entity';
import { Game } from '../model/game.entity';
import { Player } from '../model/player.entity';
import { Round } from '../model/round.entity';
import { setupDataSource, truncateAllTables } from '../test.utils';
import { EventTypeContext } from './enum/event-type-context.enum';
import { EventTypeRevisionType } from './enum/event-type-revision-type.enum';
import { PenaltyUnit } from './enum/penalty-unit.enum';
import { EventTypeRevisionService } from './event-type-revision.service';
import { EventTypeRevisionSubscriber } from './event-type-revision.subscriber';
import { EventTypeService } from './event-type.service';

describe('EventTypeRevisionService integration', () => {
  let eventTypeService: EventTypeService;
  let source: DataSource;
  let repo: Repository<EventType>;
  let revisionRepo: Repository<EventTypeRevision>;

  beforeAll(async () => {
    source = await setupDataSource([Game, Round, Player, Event, EventType, EventTypeRevision]);

    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(),
      ],
      providers: [
        EventTypeService,
        EventTypeRevisionService,
        EventTypeRevisionSubscriber,
        {
          provide: getRepositoryToken(EventType),
          useValue: source.getRepository(EventType),
        },
        {
          provide: getRepositoryToken(EventTypeRevision),
          useValue: source.getRepository(EventTypeRevision),
        }
      ],
    })
      .overrideProvider(DataSource)
      .useValue(source)
      .compile();

    eventTypeService = moduleRef.get(EventTypeService);
    repo = moduleRef.get<Repository<EventType>>(getRepositoryToken(EventType));
    revisionRepo = moduleRef.get<Repository<EventTypeRevision>>(getRepositoryToken(EventTypeRevision));
  });

  afterEach(async () => {
    await truncateAllTables(source);
  })

  afterAll(async () => {
    await source.destroy();
  });

  describe('creation', () => {
    it('should create an INSERT revision when event type is updated', async () => {
      const createdEventType = await firstValueFrom(eventTypeService.create({ context: EventTypeContext.GAME, description: 'some event type', order: 1 }));

      const revisions = await revisionRepo.find({ where: { eventType: { id: createdEventType.id } }, relations: ['eventType'] });
      expect(revisions.length).toEqual(1);
      expect(revisions[0].id).not.toEqual(createdEventType.id);
      expect(revisions[0].type).toEqual(EventTypeRevisionType.INSERT);
      expect(revisions[0].createDateTime.toISOString()).not.toEqual(createdEventType.createDateTime);
      expect(revisions[0].eventType.id).toEqual(createdEventType.id);
      expect(revisions[0].eventType.description).toEqual('some event type');
    });
  });

  describe('update', () => {
    it('should create UPDATE revisions when event type is updated', async () => {
      const createdEventType = await firstValueFrom(eventTypeService.create({ context: EventTypeContext.GAME, description: 'some event type', order: 1, penalty: { penaltyValue: 0.5, penaltyUnit: PenaltyUnit.EURO } }));

      let revisions;
      revisions = await revisionRepo.find({ where: { eventType: { id: createdEventType.id } }, relations: ['eventType'] });
      expect(revisions.length).toEqual(1);
      expect(revisions[0].id).not.toEqual(createdEventType.id);
      expect(revisions[0].type).toEqual(EventTypeRevisionType.INSERT);
      expect(revisions[0].createDateTime.toISOString()).not.toEqual(createdEventType.createDateTime);
      expect(revisions[0].eventType.id).toEqual(createdEventType.id);
      expect(revisions[0].eventType.description).toEqual('some event type');
      expect(revisions[0].eventType.penaltyValue).toEqual(0.5);
      expect(revisions[0].eventType.penaltyUnit).toEqual(PenaltyUnit.EURO);

      await firstValueFrom(eventTypeService.update(createdEventType.id, { description: 'some new event type' }));
      revisions = await revisionRepo.find({ where: { eventType: { id: createdEventType.id } }, relations: ['eventType'] });
      expect(revisions.length).toEqual(2);
      expect(revisions[1].id).not.toEqual(createdEventType.id);
      expect(revisions[1].type).toEqual(EventTypeRevisionType.UPDATE);
      expect(revisions[1].createDateTime.toISOString()).not.toEqual(createdEventType.createDateTime);
      expect(revisions[1].eventType.id).toEqual(createdEventType.id);
      expect(revisions[1].eventType.description).toEqual('some new event type');
      expect(revisions[1].eventType.penaltyValue).toEqual(0.5);
      expect(revisions[1].eventType.penaltyUnit).toEqual(PenaltyUnit.EURO);

      await firstValueFrom(eventTypeService.update(createdEventType.id, { penalty: { penaltyValue: 0.75, penaltyUnit: PenaltyUnit.EURO } }));
      revisions = await revisionRepo.find({ where: { eventType: { id: createdEventType.id } }, relations: ['eventType'] });
      expect(revisions.length).toEqual(3);
      expect(revisions[2].id).not.toEqual(createdEventType.id);
      expect(revisions[2].type).toEqual(EventTypeRevisionType.UPDATE);
      expect(revisions[2].createDateTime.toISOString()).not.toEqual(createdEventType.createDateTime);
      expect(revisions[2].eventType.id).toEqual(createdEventType.id);
      expect(revisions[1].eventType.description).toEqual('some new event type');
      expect(revisions[2].eventType.penaltyValue).toEqual(0.75);
      expect(revisions[2].eventType.penaltyUnit).toEqual(PenaltyUnit.EURO);
    });
  });

  describe('removal', () => {
    it('should create a REMOVE revision when event type is removed', async () => {
      const createdEventType = await firstValueFrom(eventTypeService.create({ context: EventTypeContext.GAME, description: 'some event type', order: 1 }));

      let revisions;
      revisions = await revisionRepo.find({ where: { eventType: { id: createdEventType.id } }, relations: ['eventType'] });
      expect(revisions.length).toEqual(1);
      expect(revisions[0].id).not.toEqual(createdEventType.id);
      expect(revisions[0].type).toEqual(EventTypeRevisionType.INSERT);
      expect(revisions[0].createDateTime.toISOString()).not.toEqual(createdEventType.createDateTime);
      expect(revisions[0].eventType.id).toEqual(createdEventType.id);
      expect(revisions[0].eventType.description).toEqual('some event type');

      await firstValueFrom(eventTypeService.remove(createdEventType.id));

      revisions = await revisionRepo.find({ where: { eventType: { id: createdEventType.id } }, relations: ['eventType'], withDeleted: true });
      expect(revisions.length).toEqual(2);
      expect(revisions[1].id).not.toEqual(createdEventType.id);
      expect(revisions[1].type).toEqual(EventTypeRevisionType.REMOVE);
      expect(revisions[1].createDateTime.toISOString()).not.toEqual(createdEventType.createDateTime);
      expect(revisions[1].deletedDateTime).toBeNull();
      expect(revisions[1].eventType.id).toEqual(createdEventType.id);
      expect(revisions[1].eventType.description).toEqual('some event type');
    });
  });
});
