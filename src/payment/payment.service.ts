import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { format } from 'date-fns';
import * as QRCode from 'qrcode';
import { combineLatest, from, Observable, of } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';
import { DataSource, Repository } from 'typeorm';
import { ensureExistence } from '../ensure-existence.operator';
import { Payment } from '../model/payment.entity';
import { PenaltyUnit } from '../penalty/enum/penalty-unit.enum';
import { PlayerService } from '../player/player.service';
import { PenaltyByPlayerDto } from '../statistics/dto';
import { PenaltyStatisticsService } from '../statistics/penalty/penalty-statistics.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { GameWithPaymentInfoDto } from './dto/game-with-payment-info.dto';
import { UserPaymentDto } from './dto/user-payment.dto';
import { PaymentBalanceDto } from './dto/payment-balance.dto';
import { OutstandingPenaltyDto } from './dto/outstanding-penalty.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { calculateDueDate } from './payment.utils';

@Injectable()
export class PaymentService {

  constructor(
    @InjectDataSource() readonly dataSource: DataSource,
    @InjectRepository(Payment) private readonly repo: Repository<Payment>,
    private readonly playerService: PlayerService,
    private readonly penaltyStatisticsService: PenaltyStatisticsService,
    private readonly configService: ConfigService,
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

  getGameList(): Observable<GameWithPaymentInfoDto[]> {
    return from(this.dataSource.query(`
      SELECT game.id, game.datetime, COALESCE(bool_and(payment.confirmed), FALSE) AS "allConfirmed" FROM payment
      RIGHT JOIN game game ON payment."gameId" = game.id
      GROUP BY game.id, payment."gameId", game.datetime
      ORDER BY game.datetime
    `));
  }

  findOne(id: string): Observable<Payment> {
    return from(this.repo.findOne({ where: { id }, relations: ['game', 'player'] })).pipe(
      ensureExistence(),
    );
  }

  countAll(): Observable<number> {
    return from(this.repo.count());
  }

  findByGameId(gameId: string): Observable<Payment[]> {
    return from(this.repo.find({
      where: { game: { id: gameId } },
      relations: ['game', 'player'],
    }));
  }

  getBalances(): Observable<PaymentBalanceDto[]> {
    return from(this.dataSource.query(`
        SELECT payment."playerId", player.name, SUM(payment."penaltyValue") as "penaltyValue", SUM(payment."outstandingValue") as "outstandingValue", payment."penaltyUnit"
        FROM payment
        LEFT JOIN player on player.id = payment."playerId"
        GROUP BY payment."playerId", player.name, payment."penaltyUnit"
        ORDER BY player.name
    `)).pipe(
      map(rows => rows.map(row => ({ ...row, penaltyValue: +row.penaltyValue, outstandingValue: +row.outstandingValue }))),
    );
  }

  getByUserId(userId: string): Observable<UserPaymentDto[]> {
    return from(this.dataSource.query(`
        SELECT game.id, game.datetime, payment."playerId", payment."penaltyValue", payment."outstandingValue", payment."penaltyUnit", payment."lastChangedDateTime", payment.confirmed, payment."confirmedAt", player.name as "confirmedBy"
        FROM payment
        LEFT JOIN game game on game.id = payment."gameId"
        LEFT JOIN player player on payment."confirmedBy" = player."auth0UserId"
        WHERE payment."playerId" = (SELECT id FROM player WHERE "auth0UserId" = '${userId}')
        ORDER BY game.datetime
    `)).pipe(
      map(rows => rows.map(row => ({
        ...row,
        penaltyValue: +row.penaltyValue,
        outstandingValue: +row.outstandingValue,
        dueDate: calculateDueDate(row.confirmed, +row.outstandingValue, row.confirmedAt),
      }))),
    );
  }

  getOutstandingPenaltiesByUserId(userId: string): Observable<OutstandingPenaltyDto[]> {
    return from(this.dataSource.query(`
        SELECT
            player.name,
            SUM(payment."outstandingValue") AS "outstandingValueSum",
            payment."penaltyUnit",
            COUNT(*),
            CASE WHEN COUNT(payment."penaltyUnit") = 1 THEN MIN(game.datetime) END AS datetime
        FROM payment
            LEFT JOIN game game ON game.id = payment."gameId"
            LEFT JOIN player player ON payment."playerId" = player."id"
        WHERE payment."playerId" = (SELECT id FROM player WHERE "auth0UserId" = '${userId}')
          AND payment."outstandingValue" > 0
        GROUP BY player.name, payment."penaltyUnit"
    `)).pipe(
      map(rows => rows.map(row => ({
        ...row,
        outstandingValueSum: +row.outstandingValueSum,
        count: +row.count,
        datetime: row.datetime ? new Date(row.datetime) : null,
      }))),
    );
  }

  update(id: string, dto: UpdatePaymentDto): Observable<Payment> {
    return from(this.repo.preload({ id, ...UpdatePaymentDto.mapForeignKeys(dto) })).pipe(
      ensureExistence(),
      switchMap(entity => from(this.repo.save(entity))),
      switchMap(() => this.findOne(id)),
    );
  }

  generateQrCode(userId: string): Observable<string> {
    return this.getOutstandingPenaltiesByUserId(userId).pipe(
      filter(penalties => !!penalties && penalties.length > 0),
      map(penalties => penalties.find(p => p.penaltyUnit === PenaltyUnit.EURO)),
      filter(Boolean),
      map(({ outstandingValueSum, count, datetime }) => this.generateBcdCode(outstandingValueSum, count, datetime)),
      switchMap(content => from(QRCode.toDataURL(content, { margin: 0, color: { dark: '#000000', light: '#ffffff00' } }))),
    );
  }

  private generateBcdCode(euroPenalty: number, penaltyCount: number, datetime: Date | null): string {
    // https://en.wikipedia.org/wiki/EPC_QR_code
    const iban = this.configService.get<string>('EPC_QR_CODE_IBAN');
    const receiverName = this.configService.get<string>('EPC_QR_CODE_RECEIVER');
    const subject = penaltyCount === 1 && !!datetime
      ? `Strafe vom ${format(datetime, 'dd.MM.yyyy')}`
      : `Strafe`;
    const description = `QR code zur Ueberweisung einer Strafe fuer die Hoptimisten`;

    return `BCD
002
1
SCT

${receiverName}
${iban}
EUR${euroPenalty.toFixed(2)}
CHAR

${subject}
${description}
`;
  }

}
