import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import * as zxcvbn from 'zxcvbn';
import * as crypto from 'crypto';
import axios from 'axios';

/**
 * Validador customizado para senhas fortes
 *
 * Critérios:
 * - Score zxcvbn >= 2 (moderado ou melhor)
 * - Não encontrada em vazamentos de dados (via HaveIBeenPwned API)
 *
 * Score zxcvbn:
 * 0 = Muito fraco (123456, password)
 * 1 = Fraco (abc123, qwerty)
 * 2 = Moderado (Senha@123)
 * 3 = Bom (Kj9#mP2$vL8nQ4!)
 * 4 = Muito forte (senhas complexas e únicas)
 */

/**
 * Verifica se uma senha foi encontrada em vazamentos usando HaveIBeenPwned API
 * Usa k-anonymity: envia apenas os primeiros 5 caracteres do hash SHA-1
 */
async function checkPasswordBreach(password: string): Promise<number> {
  try {
    // Gera hash SHA-1 da senha
    const sha1Hash = crypto
      .createHash('sha1')
      .update(password)
      .digest('hex')
      .toUpperCase();
    const prefix = sha1Hash.substring(0, 5);
    const suffix = sha1Hash.substring(5);

    // Faz requisição para API do HaveIBeenPwned
    const response = await axios.get(
      `https://api.pwnedpasswords.com/range/${prefix}`,
      {
        timeout: 5000,
        headers: {
          'User-Agent': 'PROAE-Backend-Password-Validator',
        },
      },
    );

    // Procura pelo sufixo da senha nos resultados
    const lines = response.data.split('\n');
    for (const line of lines) {
      const [hashSuffix, count] = line.split(':');
      if (hashSuffix === suffix) {
        return parseInt(count, 10);
      }
    }

    return 0; // Senha não encontrada
  } catch (error) {
    console.warn('Erro ao verificar senha vazada:', error.message);
    return 0; // Em caso de erro, considera senha como não vazada
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

          // Verificar força da senha com zxcvbn
          const result = zxcvbn(value);
          if (result.score < 2) return false;

          // Verificar se foi vazada com HaveIBeenPwned API
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
