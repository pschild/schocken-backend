import { HttpException, HttpStatus } from '@nestjs/common';

export class WhatsAppClientInitializationException extends HttpException {
  constructor(error: unknown) {
    super(`Der WhatsApp-Client konnte nicht initialisiert werden. Grund: ${error}`, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
