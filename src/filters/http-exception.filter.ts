import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly errorMessages = {
    [HttpStatus.BAD_REQUEST]: 'Dados inválidos fornecidos',
    [HttpStatus.NOT_FOUND]: 'Recurso não encontrado',
    [HttpStatus.UNPROCESSABLE_ENTITY]: 'Erro de validação nos dados fornecidos',
    [HttpStatus.INTERNAL_SERVER_ERROR]: 'Erro interno do servidor',
  };

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = this.errorMessages[HttpStatus.INTERNAL_SERVER_ERROR];
    let details: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // Se for erro de validação, mostra os detalhes específicos
      if (
        status === HttpStatus.BAD_REQUEST &&
        typeof exceptionResponse === 'object' &&
        'message' in exceptionResponse
      ) {
        const responseObj = exceptionResponse as any;
        message = Array.isArray(responseObj.message)
          ? responseObj.message
          : [responseObj.message];
        details = responseObj;
      } else {
        // Prioriza a mensagem customizada da exceção, se disponível
        if (typeof exceptionResponse === 'string') {
          message = exceptionResponse;
        } else if (
          typeof exceptionResponse === 'object' &&
          'message' in exceptionResponse
        ) {
          message = (exceptionResponse as any).message;
        } else {
          // Usa mensagem padrão apenas se não houver mensagem customizada
          message = this.errorMessages[status] || exception.message;
        }
      }
    }

    const responseBody: any = {
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    };

    // Adiciona detalhes se disponíveis (útil para debug)
    if (details && process.env.NODE_ENV !== 'production') {
      responseBody.details = details;
    }

    response.status(status).json(responseBody);
  }
}
