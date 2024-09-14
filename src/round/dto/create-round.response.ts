import { CelebrationDto } from '../../celebration';
import { RoundDto } from './round.dto';

export class CreateRoundResponse {
  round: RoundDto;
  celebration?: CelebrationDto;
}
