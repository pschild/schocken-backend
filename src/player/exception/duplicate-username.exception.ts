import { HttpException, HttpStatus } from '@nestjs/common';

export class DuplicateUsernameException extends HttpException {
  constructor() {
    super('Ein Benutzer mit diesem Namen existiert bereits.', HttpStatus.BAD_REQUEST);
  }
}
