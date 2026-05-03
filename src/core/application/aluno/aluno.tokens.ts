/**
 * Tokens para injeção de dependência (Nest).
 * A aplicação não referencia implementações concretas; o container resolve esses tokens.
 */
export const ALUNO_REPOSITORY = Symbol('IAlunoRepository');
