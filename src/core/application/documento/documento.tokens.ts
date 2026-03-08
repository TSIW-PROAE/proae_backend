/**
 * Token para injeção de dependência (Nest) da porta de Documento.
 * A aplicação não referencia implementações concretas; o container resolve esse token.
 */
export const DOCUMENTO_REPOSITORY = Symbol('IDocumentoRepository');

