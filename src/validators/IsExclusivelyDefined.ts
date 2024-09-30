import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

/**
 * Checks if the property is exclusively truthy in relation to other given properties.
 * Decorator should be set on each property within the "exclusive-or" group.
 *
 * Example:
 * @IsExclusivelyDefined(['propB', 'propC'])
 * propA: string;
 *
 * @IsExclusivelyDefined(['propA', 'propC'])
 * propB: string;
 *
 * @IsExclusivelyDefined(['propA', 'propB'])
 * propC: string;
 *
 * Meaning: Validation fails if propA/B/C is truthy together with at least one property of propA/B/C. Or: Only one property of propA/B/C
 * must be set to a truthy value simultaneously.
 */
export function IsExclusivelyDefined(properties: string[], validationOptions?: ValidationOptions) {
  return function (object: NonNullable<unknown>, propertyName: string) {
    registerDecorator({
      name: 'isNullIfDefined',
      target: object.constructor,
      propertyName: propertyName,
      constraints: properties,
      options: {
        ...validationOptions,
        message: `only one property of [${[propertyName, ...properties].join(', ')}] can be defined simultaneously`
      },
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          return !!value && properties.every(p => !(args.object as unknown)[p]);
        },
      },
    });
  };
}
