import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import * as zxcvbn from 'zxcvbn';
import * as crypto from 'crypto';
import axios from 'axios';

async function checkPasswordBreach(password: string): Promise<number> {
  try {
    const sha1Hash = crypto
      .createHash('sha1')
      .update(password)
      .digest('hex')
      .toUpperCase();
    const prefix = sha1Hash.substring(0, 5);
    const suffix = sha1Hash.substring(5);

    const response = await axios.get(
      `https://api.pwnedpasswords.com/range/${prefix}`,
      {
        timeout: 5000,
        headers: {
          'User-Agent': 'PROAE-Backend-Password-Validator',
        },
      },
    );

    const lines = response.data.split('\n');
    for (const line of lines) {
      const [hashSuffix, count] = line.split(':');
      if (hashSuffix === suffix) {
        return parseInt(count, 10);
      }
    }

    return 0;
  } catch (error: any) {
    console.warn('Erro ao verificar senha vazada:', error.message);
    return 0;
  }
}

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        async validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          const result = zxcvbn(value);
          if (result.score < 2) return false;
          const pwnedCount = await checkPasswordBreach(value);
          if (pwnedCount > 0) return false;
          return true;
        },
        defaultMessage(args: ValidationArguments) {
          const result = zxcvbn(args.value);
          if (result.score < 2) {
            return `Senha muito fraca: ${result.feedback.warning}`;
          }
          return 'Esta senha foi encontrada em vazamentos de dados. Escolha uma senha mais segura.';
        },
      },
    });
  };
}

