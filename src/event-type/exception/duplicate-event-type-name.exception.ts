import { HttpException, HttpStatus } from '@nestjs/common';

export class DuplicateEventTypeNameException extends HttpException {
  constructor() {
    super('Ein EventType mit diesem Namen existiert bereits.', HttpStatus.BAD_REQUEST);
  }
}
