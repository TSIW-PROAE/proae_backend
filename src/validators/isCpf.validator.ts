import { registerDecorator, ValidationOptions } from 'class-validator';
import { isCPF } from 'validation-br';

export const IsCPF = (validationOptions?: ValidationOptions) => {
  return (object: Object, propertyName: string) => {
    registerDecorator({
      name: 'isCPF',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: string) {
          return isCPF(value);
        },
        defaultMessage() {
          return 'O valor informado não é um CPF válido';
        },
      },
    });
  };
};
