import { PartialType } from '@nestjs/swagger';
import { CreateGameEventDto } from './create-game-event.dto';

export class UpdateGameEventDto extends PartialType(CreateGameEventDto) {}
