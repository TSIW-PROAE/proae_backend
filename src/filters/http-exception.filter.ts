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
            message = this.errorMessages[status] || message;
        } else if (exception instanceof Error) {
            // Mapeamento de tipos de erro para mensagens apropriadas
            if (exception instanceof BadRequestException) {
                status = HttpStatus.BAD_REQUEST;
                message = this.errorMessages[HttpStatus.BAD_REQUEST];
            } else if (exception instanceof NotFoundException) {
                status = HttpStatus.NOT_FOUND;
                message = this.errorMessages[HttpStatus.NOT_FOUND];
            } else if (exception instanceof UnprocessableEntityException) {
                status = HttpStatus.UNPROCESSABLE_ENTITY;
                message = this.errorMessages[HttpStatus.UNPROCESSABLE_ENTITY];
            } else if (exception instanceof InternalServerErrorException) {
                status = HttpStatus.INTERNAL_SERVER_ERROR;
                message = this.errorMessages[HttpStatus.INTERNAL_SERVER_ERROR];
            } else {
                // Para outros tipos de erro não tratados
                message = this.errorMessages[HttpStatus.INTERNAL_SERVER_ERROR];
            }
        }

        // Log do erro para debugging
        console.error('Error:', {
            status,
            message,
            timestamp: new Date().toISOString(),
            stack: exception instanceof Error ? exception.stack : undefined
        });

        response.status(status).json({
            statusCode: status,
            message,
            timestamp: new Date().toISOString(),
        });
    }
} 