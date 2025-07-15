import { HttpException, HttpStatus } from '@nestjs/common';

export class WhatsAppClientNotReadyException extends HttpException {
  constructor() {
    super(`Der WhatsApp-Client ist noch nicht bereit`, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
