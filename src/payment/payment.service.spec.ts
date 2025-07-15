import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { firstValueFrom, of } from 'rxjs';
import { Repository } from 'typeorm';
import { Payment } from '../model/payment.entity';
import { PenaltyUnit } from '../penalty/enum/penalty-unit.enum';
import { PlayerService } from '../player/player.service';
import { PenaltyStatisticsService } from '../statistics/penalty/penalty-statistics.service';
import { MockType, RANDOM_UUID } from '../test.utils';
import { PaymentService } from './payment.service';

describe('PaymentService', () => {
  let service: PaymentService;
  let playerServiceMock: MockType<PlayerService>;
  let penaltyStatisticsServiceMock: MockType<PenaltyStatisticsService>;
  let repositoryMock: MockType<Repository<Payment>>;

  const playerServiceMockFactory: () => MockType<PlayerService> = jest.fn(() => ({
    findAllActive: jest.fn(),
  }));

  const penaltyStatisticsServiceMockFactory: () => MockType<PenaltyStatisticsService> = jest.fn(() => ({
    allPenaltiesByPlayer: jest.fn(),
  }));

  const repositoryMockFactory: () => MockType<Repository<Payment>> = jest.fn(() => ({
    find: jest.fn(),
    save: jest.fn().mockReturnValue(Promise.resolve([])),
    remove: jest.fn().mockReturnValue(Promise.resolve([])),
  }));

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: PlayerService, useFactory: playerServiceMockFactory },
        { provide: PenaltyStatisticsService, useFactory: penaltyStatisticsServiceMockFactory },
        { provide: getRepositoryToken(Payment), useFactory: repositoryMockFactory }
      ],
    }).compile();

    service = module.get(PaymentService);
    playerServiceMock = module.get(PlayerService);
    penaltyStatisticsServiceMock = module.get(PenaltyStatisticsService);
    repositoryMock = module.get(getRepositoryToken(Payment));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create new payment entries', async () => {
    const gameId = RANDOM_UUID();
    const playerId1 = RANDOM_UUID();
    const playerId2 = RANDOM_UUID();
    const playerId3 = RANDOM_UUID();

    playerServiceMock.findAllActive.mockReturnValue(of([{ id: playerId1 }, { id: playerId2 }, { id: playerId3 }]));
    penaltyStatisticsServiceMock.allPenaltiesByPlayer.mockReturnValue(Promise.resolve([
      { playerId: playerId1, penaltyUnit: PenaltyUnit.EURO, penalty: 42 },
      { playerId: playerId1, penaltyUnit: PenaltyUnit.BEER_CRATE, penalty: 1 },
      { playerId: playerId2, penaltyUnit: PenaltyUnit.EURO, penalty: 21.75 },
    ]));
    repositoryMock.find.mockReturnValue(Promise.resolve([]));

    await firstValueFrom(service.apply(gameId));

    expect(repositoryMock.save).toHaveBeenCalledTimes(1);
    expect(repositoryMock.save).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ gameId, playerId: playerId1, penaltyUnit: PenaltyUnit.EURO, penaltyValue: 42, outstandingValue: 42, confirmed: false }),
        expect.objectContaining({ gameId, playerId: playerId1, penaltyUnit: PenaltyUnit.BEER_CRATE, penaltyValue: 1, outstandingValue: 1, confirmed: false }),
        expect.objectContaining({ gameId, playerId: playerId2, penaltyUnit: PenaltyUnit.EURO, penaltyValue: 21.75, outstandingValue: 21.75, confirmed: false }),
      ])
    );
  });

  describe('existing payment', () => {
    enum ExpectedAction {
      UPDATE = 'UPDATE',
      REMOVE = 'REMOVE',
      NOOP = 'NOOP'
    }

    it.each([
      // penalty value does not change
      { paymentBefore: { value: 50, outstandingValue: 0 }, penalty: 50, paymentAfter: { value: 50, outstandingValue: 0 }, expectedAction: ExpectedAction.NOOP },
      { paymentBefore: { value: 50, outstandingValue: 50 }, penalty: 50, paymentAfter: { value: 50, outstandingValue: 50 }, expectedAction: ExpectedAction.NOOP },
      { paymentBefore: { value: 50, outstandingValue: 10 }, penalty: 50, paymentAfter: { value: 50, outstandingValue: 10 }, expectedAction: ExpectedAction.NOOP },
      { paymentBefore: { value: 50, outstandingValue: -10 }, penalty: 50, paymentAfter: { value: 50, outstandingValue: -10 }, expectedAction: ExpectedAction.NOOP },

      // decreases penalty value
      { paymentBefore: { value: 50, outstandingValue: 0 }, penalty: 42, paymentAfter: { value: 42, outstandingValue: -8 }, expectedAction: ExpectedAction.UPDATE },
      { paymentBefore: { value: 50, outstandingValue: 50 }, penalty: 42, paymentAfter: { value: 42, outstandingValue: 42 }, expectedAction: ExpectedAction.UPDATE },
      { paymentBefore: { value: 50, outstandingValue: 10 }, penalty: 42, paymentAfter: { value: 42, outstandingValue: 2 }, expectedAction: ExpectedAction.UPDATE },
      { paymentBefore: { value: 50, outstandingValue: -10 }, penalty: 42, paymentAfter: { value: 42, outstandingValue: -18 }, expectedAction: ExpectedAction.UPDATE },

      // decreases to 0
      { paymentBefore: { value: 50, outstandingValue: 0 }, penalty: 0, paymentAfter: { value: 0, outstandingValue: -50 }, expectedAction: ExpectedAction.UPDATE },
      { paymentBefore: { value: 50, outstandingValue: 50 }, penalty: 0, paymentAfter: null, expectedAction: ExpectedAction.REMOVE },
      { paymentBefore: { value: 50, outstandingValue: 10 }, penalty: 0, paymentAfter: { value: 0, outstandingValue: -40 }, expectedAction: ExpectedAction.UPDATE },
      { paymentBefore: { value: 50, outstandingValue: -10 }, penalty: 0, paymentAfter: { value: 0, outstandingValue: -60 }, expectedAction: ExpectedAction.UPDATE },

      // decreases to null
      { paymentBefore: { value: 50, outstandingValue: 0 }, penalty: null, paymentAfter: { value: 0, outstandingValue: -50 }, expectedAction: ExpectedAction.UPDATE },
      { paymentBefore: { value: 50, outstandingValue: 50 }, penalty: null, paymentAfter: null, expectedAction: ExpectedAction.REMOVE },
      { paymentBefore: { value: 50, outstandingValue: 10 }, penalty: null, paymentAfter: { value: 0, outstandingValue: -40 }, expectedAction: ExpectedAction.UPDATE },
      { paymentBefore: { value: 50, outstandingValue: -10 }, penalty: null, paymentAfter: { value: 0, outstandingValue: -60 }, expectedAction: ExpectedAction.UPDATE },

      // increases penalty value
      { paymentBefore: { value: 0, outstandingValue: 0 }, penalty: 55, paymentAfter: { value: 55, outstandingValue: 55 }, expectedAction: ExpectedAction.UPDATE },
      { paymentBefore: { value: 50, outstandingValue: 0 }, penalty: 55, paymentAfter: { value: 55, outstandingValue: 5 }, expectedAction: ExpectedAction.UPDATE },
      { paymentBefore: { value: 50, outstandingValue: 50 }, penalty: 55, paymentAfter: { value: 55, outstandingValue: 55 }, expectedAction: ExpectedAction.UPDATE },
      { paymentBefore: { value: 50, outstandingValue: 10 }, penalty: 55, paymentAfter: { value: 55, outstandingValue: 15 }, expectedAction: ExpectedAction.UPDATE },
      { paymentBefore: { value: 50, outstandingValue: -10 }, penalty: 55, paymentAfter: { value: 55, outstandingValue: -5 }, expectedAction: ExpectedAction.UPDATE },
    ])('of $paymentBefore.value/$paymentBefore.outstandingValue and penalty of $penalty should trigger $expectedAction -> $paymentAfter', async ({ paymentBefore, penalty, paymentAfter, expectedAction }) => {
      const gameId = RANDOM_UUID();
      const playerId = RANDOM_UUID();
      const mockPayment = { id: 'payment1', game: { id: gameId }, player: { id: playerId }, penaltyUnit: PenaltyUnit.EURO, penaltyValue: paymentBefore.value, outstandingValue: paymentBefore.outstandingValue, confirmed: true };
      const mockPenalty = { playerId: playerId, penaltyUnit: PenaltyUnit.EURO, penalty };

      playerServiceMock.findAllActive.mockReturnValue(of([{ id: playerId }]));
      penaltyStatisticsServiceMock.allPenaltiesByPlayer.mockReturnValue(Promise.resolve(!!penalty ? [mockPenalty] : []));
      repositoryMock.find.mockReturnValue(Promise.resolve([mockPayment]));

      await firstValueFrom(service.apply(gameId));

      if (expectedAction === ExpectedAction.UPDATE) {
        expect(repositoryMock.remove).not.toHaveBeenCalled();
        expect(repositoryMock.save).toHaveBeenCalledTimes(1);
        expect(repositoryMock.save).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              ...mockPayment,
              penaltyValue: paymentAfter.value,
              outstandingValue: paymentAfter.outstandingValue,
              confirmed: false
            }),
          ])
        );
      } else if (expectedAction === ExpectedAction.REMOVE) {
        expect(repositoryMock.save).not.toHaveBeenCalled();
        expect(repositoryMock.remove).toHaveBeenCalledTimes(1);
        expect(repositoryMock.remove).toHaveBeenCalledWith(expect.arrayContaining([mockPayment]));
      } else {
        expect(repositoryMock.save).not.toHaveBeenCalled();
        expect(repositoryMock.remove).not.toHaveBeenCalled();
      }
    });
  });

  /**
   *
   * 60 Strafe
   * 60 bezahlt
   * 60 -> 50 -> Guthaben von 10 (outstanding = -10)
   * 50 -> 0  -> Guthaben von -60
   *
   * 50/0   true    null  => 0/-50  false
   * 50/10  true    null  => 0/-40  false
   * 50/-10 true    null  => 0/-60  false
   *
   * 50/0   false   null  => 0/-50  false
   * 50/50  false   null  => remove
   * 50/10  false   null  => 0/-40 false
   * 50/-10 false   null  => 0/-60 false
   *
   */
});
