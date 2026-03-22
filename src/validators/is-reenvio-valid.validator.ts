import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'IsReenvioValid', async: false })
export class IsReenvioValidConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const object = args.object as any;

    // Se requerReenvio for true, prazoReenvio e parecer devem estar presentes
    if (object.requerReenvio === true) {
      return !!(object.prazoReenvio && object.parecer);
    }

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Quando requerReenvio é true, prazoReenvio e parecer são obrigatórios';
  }
}

export function IsReenvioValid(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsReenvioValidConstraint,
    });
  };
}
