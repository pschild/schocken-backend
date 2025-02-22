import { Test } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { differenceInMilliseconds } from 'date-fns';
import { firstValueFrom } from 'rxjs';
import { DataSource, Repository } from 'typeorm';
import { Player } from '../model/player.entity';
import { getDockerDataSource, RANDOM_UUID, truncateAllTables, UUID_V4_REGEX } from '../test.utils';
import { DuplicatePlayerNameException } from './exception/duplicate-player-name.exception';
import { PlayerService } from './player.service';
import { PlayerSubscriber } from './player.subscriber';

describe('PlayerService integration', () => {
  let service: PlayerService;
  let source: DataSource;
  let repo: Repository<Player>;

  beforeAll(async () => {
    source = await getDockerDataSource();

    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(),
      ],
      providers: [
        PlayerService,
        PlayerSubscriber,
        {
          provide: getRepositoryToken(Player),
          useValue: source.getRepository(Player),
        }
      ],
    })
      .overrideProvider(DataSource)
      .useValue(source)
      .compile();

    service = moduleRef.get(PlayerService);
    repo = moduleRef.get<Repository<Player>>(getRepositoryToken(Player));
  });

  afterEach(async () => {
    await truncateAllTables(source);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('creation', () => {
    it('should create a player', async () => {
      const result = await firstValueFrom(service.create({ name: 'John' }));
      expect(result).toBeTruthy();
      expect(result.id).toMatch(UUID_V4_REGEX);
      expect(result.name).toBe('John');
      expect(differenceInMilliseconds(new Date(), new Date(result.createDateTime))).toBeLessThan(1000);
      expect(differenceInMilliseconds(new Date(), new Date(result.lastChangedDateTime))).toBeLessThan(1000);
      expect(differenceInMilliseconds(new Date(), new Date(result.registered))).toBeLessThan(1000);
      expect(result.active).toBe(true);
    });

    it('should fail if a player with given name already exists', async () => {
      await repo.save({ name: 'John' });
      await expect(firstValueFrom(service.create({ name: 'John' }))).rejects.toThrowError(new DuplicatePlayerNameException());
    });
  });

  describe('query', () => {
    it('should find a player', async () => {
      const response = await repo.save({ name: 'John' });

      const result = await firstValueFrom(service.findOne(response.id));
      expect(result).toBeTruthy();
      expect(result.name).toBe('John');
    });

    it('should return null if player not found', async () => {
      const result = await firstValueFrom(service.findOne(RANDOM_UUID()));
      expect(result).toBeNull();
    });

    it('should find all players', async () => {
      await repo.save({ name: 'John' });
      await repo.save({ name: 'Jane' });

      const result = await firstValueFrom(service.findAll());
      expect(result).toBeTruthy();
      expect(result.length).toBe(2);
      expect(result[0].name).toBe('Jane');
      expect(result[1].name).toBe('John');
    });

    it('should return empty array if no players found', async () => {
      const result = await firstValueFrom(service.findAll());
      expect(result).toStrictEqual([]);
    });

    it('should find all active players', async () => {
      await repo.save({ name: 'John' });
      await repo.save({ name: 'Jane' });
      await repo.save({ name: 'Jack', active: false });

      const result = await firstValueFrom(service.findAllActive());
      expect(result).toBeTruthy();
      expect(result.length).toBe(2);
      expect(result[0].name).toBe('John');
      expect(result[1].name).toBe('Jane');
    });
  });

  describe('update', () => {
    it('should update a player', async () => {
      const response = await repo.save({ name: 'John' });

      const findResult = await repo.findOneBy({ id: response.id });
      expect(findResult).toBeTruthy();
      expect(findResult.name).toBe('John');
      expect(findResult.active).toBe(true);

      const updateResult = await firstValueFrom(service.update(response.id, { name: 'John New', active: false }));
      expect(updateResult).toBeTruthy();
      expect(updateResult.name).toBe('John New');
      expect(updateResult.active).toBe(false);
      expect(new Date(updateResult.registered).getTime()).toBe(new Date(findResult.registered).getTime());
    });

    it('should fail if player with given id not found', async () => {
      await expect(firstValueFrom(service.update(RANDOM_UUID(), { name: 'John New' }))).rejects.toThrowError('Not Found');
    });

    it('should skip duplicate check if id is the one of existing player', async () => {
      const createdPlayer = await repo.save({ name: 'John' });

      const updateResult = await firstValueFrom(service.update(createdPlayer.id, { name: 'John', active: false }));
      expect(updateResult).toBeTruthy();
      expect(updateResult.name).toBe('John');
      expect(updateResult.active).toBe(false);
    });

    it('should fail if a player with given name already exists', async () => {
      await repo.save({ name: 'John' });
      const createdPlayer2 = await repo.save({ name: 'Jack' });

      await expect(firstValueFrom(service.update(createdPlayer2.id, { name: 'John' }))).rejects.toThrowError(new DuplicatePlayerNameException());
    });
  });

  describe('removal', () => {
    it('should remove a player', async () => {
      const response = await repo.save({ name: 'John' });
      await repo.save({ name: 'Jane' });

      const findResult = await repo.findOneBy({ id: response.id });
      expect(findResult).toBeTruthy();
      expect(findResult.name).toBe('John');
      expect(findResult.active).toBe(true);
      expect(await repo.count()).toBe(2);

      const removalResult = await firstValueFrom(service.remove(response.id));
      expect(removalResult).toBe(response.id);

      expect(await repo.findOneBy({ id: response.id })).toBeNull();
      expect(await repo.count()).toBe(1);
      expect(await repo.count({ withDeleted: true })).toBe(2);
    });

    it('should fail if player to remove not exists', async () => {
      await expect(firstValueFrom(service.remove(RANDOM_UUID()))).rejects.toThrowError(/Could not find any entity/);
    });
  });
});
