import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';
import { PlaceType } from '../game/enum/place-type.enum';

/**
 * Checks if the given `placeType` is valid regarding properties `hostedById` and `placeOfAwayGame`.
 * Following rules apply:
 * - if `placeType` is "REMOTE", neither `hostedById` nor `placeOfAwayGame` must be defined.
 * - if `placeType` is "HOME", `hostedById` must be defined.
 * - if `placeType` is "AWAY", `placeOfAwayGame` must be defined.
 */
export function PlaceValidation(validationOptions?: ValidationOptions) {
  return function (object: NonNullable<unknown>, propertyName: string) {
    registerDecorator({
      name: 'placeValidation',
      target: object.constructor,
      propertyName,
      options: {
        ...validationOptions,
        message: `placeType is not valid in combination with hostedById, placeOfAwayGame`
      },
      validator: {
        validate(value: string, args: ValidationArguments) {
          const body = args.object as { placeType: string; hostedById?: string; placeOfAwayGame?: string };
          return (value === PlaceType.REMOTE && !body.hostedById) ||
            (value === PlaceType.HOME && !!body.hostedById) ||
            (value === PlaceType.AWAY && !!body.placeOfAwayGame);
        },
      },
    });
  };
}
