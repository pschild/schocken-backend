import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';
import { CreatePenaltyDto } from '../penalty/dto/create-penalty.dto';

/**
 * Checks if the given properties of `penalty` object are valid.
 * Both `penaltyValue` and `penaltyUnit` must be given (may be null).
 *
 */
export function PenaltyValidation(validationOptions?: ValidationOptions) {
  return function (object: NonNullable<unknown>, propertyName: string) {
    registerDecorator({
      name: 'penaltyValidation',
      target: object.constructor,
      propertyName,
      options: {
        ...validationOptions,
        message: `when specified, both penaltyValue and penaltyUnit must be present`
      },
      validator: {
        validate(value: CreatePenaltyDto, args: ValidationArguments) {
          console.log(typeof value.penaltyValue !== 'undefined' && typeof value.penaltyUnit !== 'undefined');
          return typeof value.penaltyValue !== 'undefined' && typeof value.penaltyUnit !== 'undefined';
        },
      },
    });
  };
}
