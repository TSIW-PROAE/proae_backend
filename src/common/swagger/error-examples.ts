export const errorExamples = {
    badRequest: {
        statusCode: 400,
        message: 'Dados inválidos fornecidos',
        timestamp: '2024-03-21T10:00:00.000Z'
    },
    notFound: {
        statusCode: 404,
        message: 'Recurso não encontrado',
        timestamp: '2024-03-21T10:00:00.000Z'
    },
    unprocessableEntity: {
        statusCode: 422,
        message: 'Erro de validação nos dados fornecidos',
        timestamp: '2024-03-21T10:00:00.000Z'
    },
    internalServerError: {
        statusCode: 500,
        message: 'Erro interno do servidor',
        timestamp: '2024-03-21T10:00:00.000Z'
    },
    unauthorized: {
        statusCode: 401,
        message: 'Não autorizado',
        timestamp: '2024-03-21T10:00:00.000Z'
    }
}; 