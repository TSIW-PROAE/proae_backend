import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * Validador customizado para emails do domínio @ufba.br
 *
 * Aceita apenas emails institucionais da UFBA
 */
export function IsUfbaEmail(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isUfbaEmail',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;

          // Verificar se é um email válido e tem domínio @ufba.br
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) return false;

          // Verificar se termina com @ufba.br
          return value.toLowerCase().endsWith('@ufba.br');
        },
        defaultMessage(args: ValidationArguments) {
          return 'Email deve ser do domínio @ufba.br';
        },
      },
    });
  };
}
