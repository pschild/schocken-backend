import { Injectable } from '@nestjs/common';
import { AlignmentEnum, AsciiTable3 } from 'ascii-table3';
import { format } from 'date-fns';
import { combineLatest, from, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { PenaltyUnit } from '../penalty/enum/penalty-unit.enum';
import { PenaltyStatisticsService } from '../statistics/penalty/penalty-statistics.service';
import { PointsStatisticsService } from '../statistics/points/points-statistics.service';
import { WhatsAppService } from '../whats-app/whats-app.service';
import { GameDetailService } from './game-detail.service';

@Injectable()
export class GameNotificationService {

  constructor(
    private readonly gameDetailService: GameDetailService,
    private readonly whatsappService: WhatsAppService,
    private readonly penaltyStatisticsService: PenaltyStatisticsService,
    private readonly pointsStatisticsService: PointsStatisticsService,
  ) {
  }

  public sendCompleteNotification(gameId: string): Observable<string> {
    return combineLatest({
      datetime: this.gameDetailService.getDatetime(gameId),
      penaltySum: from(this.penaltyStatisticsService.penaltySum([gameId], true)),
      penaltiesByPlayer: from(this.penaltyStatisticsService.penaltyByPlayerTable([gameId], true)),
      points: from(this.pointsStatisticsService.pointsPerGame([gameId], true)),
    }).pipe(
      map(({ datetime, penaltySum, penaltiesByPlayer, points }) => {
        const winnerNames = points[0].points
          .filter(item => item.rank === 1)
          .map(item => `🥇 *${item.name}* `);

        const rows = points[0].points
          .map(player => {
            const euroSum = penaltiesByPlayer.find(item => item.playerId === player.playerId)?.euroSum || 0;
            if (!!player.rank || euroSum > 0) {
              return [
                player.rank ? `${player.rank}.` : '-',
                player.name,
                player.points,
                this.formatCurrency(euroSum)
              ];
            }
          });

        const asciiTable =
          new AsciiTable3()
            .setHeading('', 'Name', 'Punkte', 'Strafen')
            .setHeadingAlign(AlignmentEnum.LEFT)
            .setAlign(4, AlignmentEnum.RIGHT)
            .setStyle('none')
            .addRowMatrix([
              ...rows.filter(row => !!row),
              ['', '', '', this.formatCurrency(penaltySum.find(p => p.unit === PenaltyUnit.EURO).sum)]
            ]);

        return `*Strafen vom ${format(datetime, 'dd.MM.yyyy')}*

Sieger des Abends: ${winnerNames.join(', ')}

\`\`\`
${asciiTable.toString()}
\`\`\`
Bitte überweise deine Strafe innerhalb der nächsten 14 Tage auf das bekannte Konto. 💸

Details zum Spiel findest du in der App unter https://hopti.pschild.de/game/${gameId}
        `;
      }),
      tap(message => this.whatsappService.send(message))
    );
  }

  private formatCurrency(value: number): string {
    return `${value.toFixed(2).replace('.', ',')} €`;
  }

}
