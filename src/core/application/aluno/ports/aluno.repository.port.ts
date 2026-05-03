/**
 * Re-export da porta do domínio para a aplicação.
 * A camada de aplicação depende apenas das portas (interfaces), não da infra.
 */
export type { IAlunoRepository } from '../../../domain/aluno/ports/aluno.repository.port';
