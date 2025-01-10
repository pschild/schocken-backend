import { Test } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import * as fs from 'fs';
import { DataSource, Repository } from 'typeorm';
import { EventType } from '../../src/model/event-type.entity';
import { Event } from '../../src/model/event.entity';
import { Game } from '../../src/model/game.entity';
import { Player } from '../../src/model/player.entity';
import { Round } from '../../src/model/round.entity';
import { getDockerDataSource, truncateAllTables } from '../../src/test.utils';

describe('Dump of production data', () => {
  let source: DataSource;

  let playerRepo: Repository<Player>;
  let gameRepo: Repository<Game>;
  let roundRepo: Repository<Round>;
  let eventTypeRepo: Repository<EventType>;
  let eventRepo: Repository<Event>;

  beforeAll(async () => {
    source = await getDockerDataSource();

    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(),
      ],
      providers: [
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
          provide: getRepositoryToken(EventType),
          useValue: source.getRepository(EventType),
        },
        {
          provide: getRepositoryToken(Event),
          useValue: source.getRepository(Event),
        },
      ],
    })
      .overrideProvider(DataSource)
      .useValue(source)
      .compile();

    playerRepo = moduleRef.get<Repository<Player>>(getRepositoryToken(Player));
    gameRepo = moduleRef.get<Repository<Game>>(getRepositoryToken(Game));
    roundRepo = moduleRef.get<Repository<Round>>(getRepositoryToken(Round));
    eventTypeRepo = moduleRef.get<Repository<EventType>>(getRepositoryToken(EventType));
    eventRepo = moduleRef.get<Repository<Event>>(getRepositoryToken(Event));

    const queries = fs.readFileSync(__dirname + '/2024-09-11-dump.sql').toString()
      .replaceAll('hoptimisten.', '')
      .matchAll(/INSERT.*;/g);
    const inserts = [...queries].map(query => query[0]);

    for (const sql of inserts) {
      await source.manager.query(sql);
    }
  }, 60000);

  afterAll(async () => {
    await truncateAllTables(source);
    await source.destroy();
  });

  it('should count the correct amount of rows', async () => {
    expect(await playerRepo.count()).toEqual(11);
    expect(await gameRepo.count()).toEqual(73);
    expect(await roundRepo.count()).toEqual(2181);
    expect(await eventTypeRepo.count()).toEqual(29);
    expect(await eventRepo.count()).toEqual(13653);

    expect((await source.manager.query("SELECT COUNT(*) FROM attendances"))[0].count).toEqual('13682');
    expect((await source.manager.query("SELECT COUNT(*) FROM finals"))[0].count).toEqual('307');
  });
});
