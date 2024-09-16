import { HttpException, HttpStatus } from '@nestjs/common';

export class GameCompletedException extends HttpException {
  constructor(gameId: string) {
    super(`Das Spiel mit der ID ${gameId} ist bereits abgeschlossen und kann nicht mehr bearbeitet werden.`, HttpStatus.FORBIDDEN);
  }
}
