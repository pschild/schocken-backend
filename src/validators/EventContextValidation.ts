import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';
import { EventContext } from '../event/enum/event-context.enum';

/**
 * Checks if the given `context` is valid regarding properties `gameId` and `roundId`.
 * Following rules apply:
 * - if `context` is "GAME", `gameId` must be defined.
 * - if `context` is "ROUND", `roundId` must be defined.
 */
export function EventContextValidation(validationOptions?: ValidationOptions) {
  return function (object: NonNullable<unknown>, propertyName: string) {
    registerDecorator({
      name: 'eventContextValidation',
      target: object.constructor,
      propertyName,
      options: {
        ...validationOptions,
        message: `context is not valid in combination with gameId, roundId`
      },
      validator: {
        validate(value: string, args: ValidationArguments) {
          const body = args.object as { context: EventContext; gameId?: string; roundId?: string };
          return (value === EventContext.GAME && !!body.gameId) ||
            (value === EventContext.ROUND && !!body.roundId);
        },
      },
    });
  };
}
