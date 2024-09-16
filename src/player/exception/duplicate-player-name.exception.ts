import { HttpException, HttpStatus } from '@nestjs/common';

export class DuplicatePlayerNameException extends HttpException {
  constructor() {
    super('Ein Spieler mit diesem Namen existiert bereits.', HttpStatus.BAD_REQUEST);
  }
}
