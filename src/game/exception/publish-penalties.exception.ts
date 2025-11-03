import { HttpException, HttpStatus } from '@nestjs/common';

export class PublishPenaltiesException extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.FORBIDDEN);
  }
}
