import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    BadRequestException,
    NotFoundException,
    UnprocessableEntityException,
    InternalServerErrorException,
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

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            message = this.errorMessages[status];
        }

        response.status(status).json({
            statusCode: status,
            message,
            timestamp: new Date().toISOString(),
        });
    }
} 