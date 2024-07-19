import { Test } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { setupDataSource } from '../database/setup-test-data-source';
import { PlayerEntity } from '../model/player.entity';
import { PlayerService } from './player.service';

describe('PlayerService', () => {
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
          useClass: Repository,
        }
      ],
    })
      .overrideProvider(DataSource)
      .useValue(source)
      .compile();

    service = moduleRef.get(PlayerService);
    repo = source.getRepository(PlayerEntity);
  });

  afterAll(async () => {
    await source.destroy();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find a user', async () => {
    await repo.save({ name: 'Susi' });

    console.log(await repo.countBy({ name: 'Susi' }));

    const response = await repo.findOneBy({ name: 'Susi' });

    expect(response).toBeTruthy();
    expect(response.name).toBe('Susi');
  });
});
