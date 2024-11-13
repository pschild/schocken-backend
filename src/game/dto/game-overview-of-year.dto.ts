import { ApiProperty } from '@nestjs/swagger';
import { PenaltyDto } from '../../penalty/dto/penalty.dto';
import { GameOverviewDto } from './game-overview.dto';

export class GameOverviewOfYearDto {
  @ApiProperty({ type: String })
  year: string;

  @ApiProperty({ type: [GameOverviewDto] })
  games: GameOverviewDto[];

  @ApiProperty({ type: [PenaltyDto] })
  penaltySum: PenaltyDto[];
}
