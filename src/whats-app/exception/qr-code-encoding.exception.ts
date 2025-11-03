import { HttpException, HttpStatus } from '@nestjs/common';

export class QrCodeEncodingException extends HttpException {
  constructor(error: unknown) {
    super(`QR-Code zur Anmeldung konnte nicht gelesen werden. Grund: ${error}`, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
