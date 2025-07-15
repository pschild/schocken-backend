import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { combineLatest, from, Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { DataSource, Repository } from 'typeorm';
import { ensureExistence } from '../ensure-existence.operator';
import { Payment } from '../model/payment.entity';
import { PenaltyUnit } from '../penalty/enum/penalty-unit.enum';
import { PlayerService } from '../player/player.service';
import { PenaltyByPlayerDto } from '../statistics/dto';
import { PenaltyStatisticsService } from '../statistics/penalty/penalty-statistics.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentSummaryByPlayerDto } from './dto/payment-summary-by-player.dto';
import { PaymentSummaryDto } from './dto/payment-summary.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Injectable()
export class PaymentService {

  constructor(
    @InjectDataSource() readonly dataSource: DataSource,
    @InjectRepository(Payment) private readonly repo: Repository<Payment>,
    private readonly playerService: PlayerService,
    private readonly penaltyStatisticsService: PenaltyStatisticsService,
  ) {
  }

  apply(gameId: string): Observable<Payment[]> {
    return combineLatest([
      this.playerService.findAllActive(),
      from(this.penaltyStatisticsService.allPenaltiesByPlayer([gameId], true)),
      this.findByGameId(gameId),
    ]).pipe(
      map(([activePlayers, penalties, payments]) => {
        // create or update payments for all active players and penalty units
        return activePlayers.reduce<{
          entitiesToSave: Array<CreatePaymentDto | Payment>,
          entitiesToRemove: Payment[]
        }>((acc, activePlayer) => {
          const entitiesToSave: Array<CreatePaymentDto | Payment> = [];
          const entitiesToRemove: Payment[] = [];

          Object.keys(PenaltyUnit).map(unit => {
            const penalty = penalties.find(penalty => penalty.playerId === activePlayer.id && penalty.penaltyUnit === unit);
            const payment = payments.find(payment => payment.player?.id === activePlayer.id && payment.penaltyUnit === unit);

            if (!!payment) {
              if (!!penalty) {
                if (penalty.penalty !== payment.penaltyValue) {
                  // ein bestehender Eintrag hat sich geaendert und muss angepasst werden
                  entitiesToSave.push(this.updatePayment(payment, penalty));
                }
              } else {
                if (payment.penaltyValue === payment.outstandingValue) {
                  // ein bestehender Eintrag, bei dem noch keine Zahlung vorgenommen wurde, wird geloescht, da es keine Strafe mehr gibt
                  entitiesToRemove.push(payment);
                } else {
                  // ein bestehener Eintrag, bei dem bereits etwas verrechnet wurde, muss aufgrund der nun fehlenden Strafe angepasst werden
                  entitiesToSave.push(this.updatePayment(payment, { playerId: activePlayer.id, penaltyUnit: payment.penaltyUnit, penalty: 0 }));
                }
              }
            } else if (!!penalty && penalty.penalty > 0) {
              // es bestand kein Eintrag, aber eine Strafe ist faellig, daher wird ein Eintrag angelegt
              entitiesToSave.push(this.createPayment(gameId, activePlayer.id, penalty));
            }
          });

          return {
            entitiesToSave: [...acc.entitiesToSave, ...entitiesToSave],
            entitiesToRemove: [...acc.entitiesToRemove, ...entitiesToRemove]
          };
        }, {entitiesToSave: [], entitiesToRemove: []})
      }),
      switchMap(({ entitiesToSave, entitiesToRemove }) => {
        const removeAction = entitiesToRemove.length > 0
          ? from(this.repo.remove(entitiesToRemove))
          : of([]);

        const saveAction = entitiesToSave.length > 0
          ? from(this.repo.save(this.mapToSavableEntity(entitiesToSave)))
          : of([]);

        return removeAction.pipe(
          switchMap(() => saveAction),
        );
      }),
    );
  }

  private mapToSavableEntity(items: Array<CreatePaymentDto | Payment>): Array<CreatePaymentDto | Payment> {
    return items.map(item => {
      if (item instanceof CreatePaymentDto) {
        return CreatePaymentDto.mapForeignKeys(item);
      }
      return item;
    });
  }

  private updatePayment(payment: Payment, penalty: PenaltyByPlayerDto): Payment {
    const diff = penalty.penalty - payment.penaltyValue;

    payment.penaltyValue = penalty.penalty;
    payment.outstandingValue = payment.outstandingValue + diff; // Aenderung der Strafe wird mit ausstehendem Betrag verrechnet
    payment.confirmedBy = null;
    payment.confirmed = false;

    return payment;
  }

  private createPayment(gameId: string, playerId: string, penalty: PenaltyByPlayerDto): CreatePaymentDto {
    const dto = new CreatePaymentDto();

    dto.gameId = gameId;
    dto.playerId = playerId;
    dto.penaltyUnit = penalty.penaltyUnit;
    dto.penaltyValue = penalty.penalty;
    dto.outstandingValue = penalty.penalty;
    dto.confirmed = false;
    return dto;
  }

  findOne(id: string): Observable<Payment> {
    return from(this.repo.findOne({ where: { id }, relations: ['game', 'player'] })).pipe(
      ensureExistence(),
    );
  }

  findByGameId(gameId: string): Observable<Payment[]> {
    return from(this.repo.find({
      where: { game: { id: gameId } },
      relations: ['game', 'player'],
    }));
  }

  getPaymentSummary(): Observable<PaymentSummaryDto[]> {
    return from(this.dataSource.query(`
        SELECT payment."playerId", player.name, SUM(payment."penaltyValue") as "penaltyValue", SUM(payment."outstandingValue") as "outstandingValue", payment."penaltyUnit" FROM payment
        LEFT JOIN player on player.id = payment."playerId"
        GROUP BY payment."playerId", player.name, payment."penaltyUnit"
        ORDER BY player.name
    `)).pipe(
      map(rows => rows.map(row => ({ ...row, penaltyValue: +row.penaltyValue, outstandingValue: +row.outstandingValue }))),
    );
  }

  getPaymentPlayerSummary(userId: string): Observable<PaymentSummaryByPlayerDto[]> {
    return from(this.dataSource.query(`
        SELECT game.id, game.datetime, payment."playerId", payment."penaltyValue", payment."outstandingValue", payment."penaltyUnit", payment."lastChangedDateTime", payment.confirmed, player.name as "confirmedBy" FROM payment
        LEFT JOIN game game on game.id = payment."gameId"
        LEFT JOIN player player on payment."confirmedBy" = player."auth0UserId"
        WHERE payment."playerId" = (SELECT id FROM player WHERE "auth0UserId" = '${userId}')
        ORDER BY game.datetime
    `)).pipe(
      map(rows => rows.map(row => ({ ...row, penaltyValue: +row.penaltyValue, outstandingValue: +row.outstandingValue }))),
    );
  }

  update(id: string, dto: UpdatePaymentDto): Observable<Payment> {
    return from(this.repo.preload({ id, ...UpdatePaymentDto.mapForeignKeys(dto) })).pipe(
      ensureExistence(),
      switchMap(entity => from(this.repo.save(entity))),
      switchMap(() => this.findOne(id)),
    );
  }

}
