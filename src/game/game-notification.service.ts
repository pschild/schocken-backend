import { Injectable } from '@nestjs/common';
import { AlignmentEnum, AsciiTable3 } from 'ascii-table3';
import { format } from 'date-fns';
import { combineLatest, from, Observable, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { PenaltyUnit } from '../penalty/enum/penalty-unit.enum';
import { PenaltyStatisticsService } from '../statistics/penalty/penalty-statistics.service';
import { PointsStatisticsService } from '../statistics/points/points-statistics.service';
import { WhatsAppSentMessageDto } from '../whats-app/dto/whats-app-sent-message.dto';
import { WhatsAppService } from '../whats-app/whats-app.service';
import { PublishPenaltiesException } from './exception/publish-penalties.exception';
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

  public publishPenalties(gameId: string): Observable<WhatsAppSentMessageDto> {
    return combineLatest({
      game: this.gameDetailService.findOne(gameId),
      penaltySum: from(this.penaltyStatisticsService.penaltySum([gameId], true)),
      penaltiesByPlayer: from(this.penaltyStatisticsService.euroPenaltyByPlayerTable([gameId], true)),
      points: from(this.pointsStatisticsService.pointsPerGame([gameId], true)),
    }).pipe(
      map(({ game, penaltySum, penaltiesByPlayer, points }) => {
        if (!game.completed) {
          throw new PublishPenaltiesException(`Strafen konnten nicht veröffentlicht werden, da das Spiel nicht abgeschlossen ist.`);
        }

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

        return `*Zusammenfassung des Spiels vom ${format(game.datetime, 'dd.MM.yyyy')}*

Sieger des Abends (nach Punkten): ${winnerNames.join(', ')}

\`\`\`
${asciiTable.toString()}
\`\`\`
Bitte überweise deine Strafe innerhalb der nächsten 14 Tage auf das bekannte Konto. 💸

📊 Dein Dashboard: https://hopti.pschild.de/dashboard
🎲 Zum Spiel: https://hopti.pschild.de/game/${gameId}
        `;
      }),
      switchMap(message => from(this.whatsappService.send(message)).pipe(
        map(messageId => ({ messageId: messageId._serialized }))
      ))
    );
  }

  private formatCurrency(value: number): string {
    return `${value.toFixed(2).replace('.', ',')} €`;
  }

}
