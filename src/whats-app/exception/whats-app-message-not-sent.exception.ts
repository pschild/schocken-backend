import { HttpException, HttpStatus } from '@nestjs/common';

export class WhatsAppMessageNotSentException extends HttpException {
  constructor(error: unknown) {
    super(`Die WhatsApp-Nachricht konnte nicht versendet werden. Grund: ${error}`, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
