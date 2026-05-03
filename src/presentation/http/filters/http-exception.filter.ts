import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

/** Formato único de erro da API: statusCode, message (texto curto), errors (lista de mensagens quando for validação). */
export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  errors?: string[];
  timestamp: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly errorMessages: Record<number, string> = {
    [HttpStatus.BAD_REQUEST]: 'Dados inválidos',
    [HttpStatus.UNAUTHORIZED]: 'Não autorizado',
    [HttpStatus.FORBIDDEN]: 'Acesso negado',
    [HttpStatus.NOT_FOUND]: 'Recurso não encontrado',
    [HttpStatus.UNPROCESSABLE_ENTITY]: 'Erro de validação nos dados fornecidos',
    [HttpStatus.INTERNAL_SERVER_ERROR]: 'Erro interno do servidor',
  };

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = this.errorMessages[HttpStatus.INTERNAL_SERVER_ERROR];
    let errors: string[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null && 'message' in res) {
        const msg = (res as { message?: string | string[] }).message;
        if (Array.isArray(msg)) {
          errors = msg.map((m) => (typeof m === 'string' ? m : String(m)));
          message = errors.length === 1 ? errors[0] : this.errorMessages[status] ?? 'Erro de validação';
        } else {
          message = typeof msg === 'string' ? msg : String(msg);
        }
      } else {
        message = this.errorMessages[status] ?? (exception as Error).message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      if (message.includes('Redis') || message.includes('redis')) {
        status = HttpStatus.SERVICE_UNAVAILABLE;
      }
    }

    const body: ApiErrorResponse = {
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    };
    if (errors?.length) body.errors = errors;

    response.status(status).json(body);
  }
}
