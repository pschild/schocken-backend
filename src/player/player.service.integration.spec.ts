import { Test } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { DataSource, Repository } from 'typeorm';
import { setupDataSource } from '../database/setup-test-data-source';
import { PlayerEntity } from '../model/player.entity';
import { RANDOM_UUID, UUID_V4_REGEX } from '../test.utils';
import { PlayerService } from './player.service';
import { differenceInMilliseconds } from 'date-fns';

/**
 * Blueprint for how to test a service using an in-memory database in background.
 */
describe('PlayerService integration', () => {
  let service: PlayerService;
  let source: DataSource;
  let repo: Repository<PlayerEntity>;

  beforeAll(async () => {
    source = await setupDataSource([PlayerEntity]);

    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(),
      ],
      providers: [
        PlayerService,
        {
          provide: getRepositoryToken(PlayerEntity),
          useValue: source.getRepository(PlayerEntity),
        }
      ],
    })
      .overrideProvider(DataSource)
      .useValue(source)
      .compile();

    service = moduleRef.get(PlayerService);
    repo = moduleRef.get<Repository<PlayerEntity>>(getRepositoryToken(PlayerEntity));
  });

  afterEach(async () => {
    await repo.clear();
  })

  afterAll(async () => {
    await source.destroy();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a user', async () => {
    const result = await firstValueFrom(service.create({ name: 'John' }));
    expect(result).toBeTruthy();
    expect(result.id).toMatch(UUID_V4_REGEX);
    expect(result.name).toBe('John');
    expect(differenceInMilliseconds(new Date(), new Date(result.createDateTime))).toBeLessThan(100);
    expect(differenceInMilliseconds(new Date(), new Date(result.lastChangedDateTime))).toBeLessThan(100);
    expect(differenceInMilliseconds(new Date(), new Date(result.registered))).toBeLessThan(100);
    expect(result.active).toBe(true);
  });

  it('should find a user', async () => {
    const response = await repo.save({ name: 'John' });

    const result = await firstValueFrom(service.findOne(response.id));
    expect(result).toBeTruthy();
    expect(result.name).toBe('John');
  });

  it('should return null if user not found', async () => {
    const result = await firstValueFrom(service.findOne(RANDOM_UUID));
    expect(result).toBeNull();
  });

  it('should find all users', async () => {
    await repo.save({ name: 'John' });
    await repo.save({ name: 'Jane' });

    const result = await firstValueFrom(service.getAll());
    expect(result).toBeTruthy();
    expect(result.length).toBe(2);
    expect(result[0].name).toBe('John');
    expect(result[1].name).toBe('Jane');
  });

  it('should return empty array if no users found', async () => {
    const result = await firstValueFrom(service.getAll());
    expect(result).toStrictEqual([]);
  });

  it('should find all active users', async () => {
    await repo.save({ name: 'John' });
    await repo.save({ name: 'Jane' });
    await repo.save({ name: 'Jack', active: false });

    const result = await firstValueFrom(service.getAllActive());
    expect(result).toBeTruthy();
    expect(result.length).toBe(2);
    expect(result[0].name).toBe('John');
    expect(result[1].name).toBe('Jane');
  });

  it('should update a user', async () => {
    const response = await repo.save({ name: 'John' });

    const findResult = await repo.findOneBy({ id: response.id });
    expect(findResult).toBeTruthy();
    expect(findResult.name).toBe('John');
    expect(findResult.active).toBe(true);

    const updateResult = await firstValueFrom(service.update(response.id, { name: 'John New', active: false }));
    expect(updateResult).toBeTruthy();
    expect(updateResult.name).toBe('John New');
    expect(updateResult.active).toBe(false);
  });

  it('should return null when user to update is not found', async () => {
    const updateResult = await firstValueFrom(service.update(RANDOM_UUID, { name: 'John New' }));
    expect(updateResult).toBeNull();
  });

  it('should remove a user', async () => {
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
  });
});
