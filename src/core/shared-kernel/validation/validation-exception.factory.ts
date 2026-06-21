import { BadRequestException, ValidationError } from '@nestjs/common';
import { humanizeValidationMessage } from './humanize-validation-message';

function collectMessages(errors: ValidationError[], prefix = ''): string[] {
  const out: string[] = [];
  for (const err of errors) {
    const path = prefix ? `${prefix}.${err.property}` : err.property;
    if (err.constraints) {
      for (const raw of Object.values(err.constraints)) {
        out.push(humanizeValidationMessage(raw, path));
      }
    }
    if (err.children?.length) {
      out.push(...collectMessages(err.children, path));
    }
  }
  return out;
}

/** Factory para o ValidationPipe — mensagens em português, sem jargão técnico. */
export function validationExceptionFactory(errors: ValidationError[]) {
  const messages = collectMessages(errors);
  const unique = [...new Set(messages)];
  return new BadRequestException({
    statusCode: 400,
    error: 'Dados inválidos',
    message: unique.length === 1 ? unique[0] : unique,
    errors: unique,
  });
}
