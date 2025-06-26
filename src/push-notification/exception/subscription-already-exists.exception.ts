import { HttpException, HttpStatus } from '@nestjs/common';

export class SubscriptionAlreadyExistsException extends HttpException {
  constructor(userId: string) {
    super(`Für den Benutzer der ID ${userId} existiert bereits eine PushSubscription.`, HttpStatus.BAD_REQUEST);
  }
}
