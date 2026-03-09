/**
 * Re-export da porta do domínio para a aplicação.
 * A camada de aplicação depende apenas das portas (interfaces), não da infra.
 */
export type { IDocumentoRepository } from '../../../domain/documento/ports/documento.repository.port';

