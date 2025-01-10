import { Test } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { DataSource } from 'typeorm';
import { EventTypeContext } from '../event-type/enum/event-type-context.enum';
import { EventTypeService } from '../event-type/event-type.service';
import { EventContext } from '../event/enum/event-context.enum';
import { EventDetailService } from '../event/event-detail.service';
import { EventType } from '../model/event-type.entity';
import { Event } from '../model/event.entity';
import { Game } from '../model/game.entity';
import { Player } from '../model/player.entity';
import { Round } from '../model/round.entity';
import { PenaltyUnit } from '../penalty/enum/penalty-unit.enum';
import { PlayerService } from '../player/player.service';
import { RoundDetailService } from '../round/round-detail.service';
import { getDockerDataSource, truncateAllTables } from '../test.utils';
import { PlaceType } from './enum/place-type.enum';
import { GameDetailService } from './game-detail.service';
import { GameOverviewService } from './game-overview.service';

describe('GameOverview', () => {
  let service: GameOverviewService;
  let gameDetailService: GameDetailService;
  let roundService: RoundDetailService;
  let playerService: PlayerService;
  let eventService: EventDetailService;
  let eventTypeService: EventTypeService;
  let source: DataSource;

  beforeAll(async () => {
    source = await getDockerDataSource();

    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(),
      ],
      providers: [
        GameOverviewService,
        GameDetailService,
        RoundDetailService,
        PlayerService,
        EventDetailService,
        EventTypeService,
        {
          provide: getRepositoryToken(Game),
          useValue: source.getRepository(Game),
        },
        {
          provide: getRepositoryToken(Round),
          useValue: source.getRepository(Round),
        },
        {
          provide: getRepositoryToken(Player),
          useValue: source.getRepository(Player),
        },
        {
          provide: getRepositoryToken(Event),
          useValue: source.getRepository(Event),
        },
        {
          provide: getRepositoryToken(EventType),
          useValue: source.getRepository(EventType),
        }
      ],
    })
      .overrideProvider(DataSource)
      .useValue(source)
      .compile();

    service = moduleRef.get(GameOverviewService);
    gameDetailService = moduleRef.get(GameDetailService);
    roundService = moduleRef.get(RoundDetailService);
    playerService = moduleRef.get(PlayerService);
    eventService = moduleRef.get(EventDetailService);
    eventTypeService = moduleRef.get(EventTypeService);
  });

  afterEach(async () => {
    await truncateAllTables(source);
  });

  describe('should query overview of games', () => {
    it('with the correct grouping of games', async () => {
      await firstValueFrom(gameDetailService.create({ placeType: PlaceType.REMOTE, datetime: '2022-11-26T12:34:56' }));
      await firstValueFrom(gameDetailService.create({ placeType: PlaceType.REMOTE, datetime: '2023-11-26T12:34:56' }));
      await firstValueFrom(gameDetailService.create({ placeType: PlaceType.REMOTE, datetime: '2024-10-29T12:34:56' }));
      await firstValueFrom(gameDetailService.create({ placeType: PlaceType.REMOTE, datetime: '2024-11-26T12:34:56' }));

      const result = await firstValueFrom(service.getOverview());
      expect(result.length).toBe(3);

      const gamesIn2024 = result[0];
      expect(gamesIn2024.year).toEqual('2024');
      expect(gamesIn2024.games.length).toBe(2);

      const gamesIn2023 = result[1];
      expect(gamesIn2023.year).toEqual('2023');
      expect(gamesIn2023.games.length).toBe(1);

      const gamesIn2022 = result[2];
      expect(gamesIn2022.year).toEqual('2022');
      expect(gamesIn2022.games.length).toBe(1);
    });

    it('with the correct penalty sums', async () => {
      const createdPlayer1 = await firstValueFrom(playerService.create({ name: 'John' }));
      const createdPlayer2 = await firstValueFrom(playerService.create({ name: 'Jack' }));

      const createdGame = await firstValueFrom(gameDetailService.create({ placeType: PlaceType.HOME, hostedById: createdPlayer1.id, datetime: '2024-11-26T12:34:56' }));
      const createdRound1 = await firstValueFrom(roundService.create({ gameId: createdGame.id }));
      const createdRound2 = await firstValueFrom(roundService.create({ gameId: createdGame.id }));

      const createdEventType1 = await firstValueFrom(eventTypeService.create({ context: EventTypeContext.GAME, description: 'test 1', penalty: { penaltyValue: 0.75, penaltyUnit: PenaltyUnit.EURO } }));
      const createdEventType2 = await firstValueFrom(eventTypeService.create({ context: EventTypeContext.GAME, description: 'test 2', penalty: { penaltyValue: 1, penaltyUnit: PenaltyUnit.BEER_CRATE } }));
      const createdEventType3 = await firstValueFrom(eventTypeService.create({ context: EventTypeContext.ROUND, description: 'test 3', penalty: { penaltyValue: 0.1, penaltyUnit: PenaltyUnit.EURO } }));
      const createdEventType4 = await firstValueFrom(eventTypeService.create({ context: EventTypeContext.ROUND, description: 'test 4', penalty: { penaltyValue: 2, penaltyUnit: PenaltyUnit.EURO } }));
      const createdEventType5 = await firstValueFrom(eventTypeService.create({ context: EventTypeContext.ROUND, description: 'test 5' }));

      await firstValueFrom(eventService.create({ context: EventContext.GAME, gameId: createdGame.id, playerId: createdPlayer1.id, eventTypeId: createdEventType1.id }));
      await firstValueFrom(eventService.create({ context: EventContext.GAME, gameId: createdGame.id, playerId: createdPlayer2.id, eventTypeId: createdEventType2.id }));
      await firstValueFrom(eventService.create({ context: EventContext.ROUND, roundId: createdRound1.round.id, playerId: createdPlayer1.id, eventTypeId: createdEventType3.id, multiplicatorValue: 6 }));
      await firstValueFrom(eventService.create({ context: EventContext.ROUND, roundId: createdRound1.round.id, playerId: createdPlayer2.id, eventTypeId: createdEventType4.id }));
      await firstValueFrom(eventService.create({ context: EventContext.ROUND, roundId: createdRound2.round.id, playerId: createdPlayer1.id, eventTypeId: createdEventType5.id }));

      const result = await firstValueFrom(service.getOverview());
      expect(result.length).toBe(1);

      const gamesIn2024 = result[0];
      expect(gamesIn2024.year).toEqual('2024');
      expect(gamesIn2024.games.length).toBe(1);

      expect(gamesIn2024.games[0].hostedBy.name).toEqual(createdPlayer1.name);
      expect(gamesIn2024.games[0].events.length).toBe(2);

      expect(gamesIn2024.games[0].rounds.length).toBe(2);
      expect(gamesIn2024.games[0].rounds[0].events.length).toBe(2);
      expect(gamesIn2024.games[0].rounds[1].events.length).toBe(1);

      expect(gamesIn2024.penaltySum.length).toBe(2);
      expect(gamesIn2024.penaltySum.find(p => p.unit === PenaltyUnit.EURO).sum).toBe(3.35);
      expect(gamesIn2024.penaltySum.find(p => p.unit === PenaltyUnit.BEER_CRATE).sum).toBe(1);
    });
  });
});
