import { Inject, Injectable } from '@nestjs/common';
import type { IEditalRepository } from '../ports/edital.repository.port';
import type { StatusEditalDomain } from '../../../domain/edital/edital.types';
import { EDITAL_REPOSITORY } from '../edital.tokens';
import { EditalNaoEncontradoError } from './find-edital-by-id.use-case';

export class StatusEditalInvalidoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StatusEditalInvalidoError';
  }
}

const STATUS_MAP: Record<string, StatusEditalDomain> = {
  RASCUNHO: 'RASCUNHO',
  ABERTO: 'ABERTO',
  ENCERRADO: 'ENCERRADO',
  EM_ANDAMENTO: 'EM_ANDAMENTO',
};

/** Regras de negócio: edital completo para ABERTO/EM_ANDAMENTO; ENCERRADO só de ABERTO/EM_ANDAMENTO */
function isEditalComplete(edital: {
  titulo_edital?: string;
  descricao?: string;
  edital_url?: unknown[];
  etapa_edital?: unknown[];
}): boolean {
  return !!(
    edital.titulo_edital &&
    edital.descricao &&
    edital.edital_url &&
    edital.edital_url.length > 0 &&
    edital.etapa_edital &&
    edital.etapa_edital.length > 0
  );
}

@Injectable()
export class UpdateEditalStatusUseCase {
  constructor(
    @Inject(EDITAL_REPOSITORY)
    private readonly editalRepository: IEditalRepository,
  ) {}

  async execute(
    id: number,
    statusParam: 'RASCUNHO' | 'ABERTO' | 'ENCERRADO' | 'EM_ANDAMENTO',
  ) {
    const edital = await this.editalRepository.findOne(id);
    if (!edital) throw new EditalNaoEncontradoError(id);

    const novoStatus = STATUS_MAP[statusParam];
    if (!novoStatus) {
      throw new StatusEditalInvalidoError(
        'Status inválido. Use: RASCUNHO, ABERTO, ENCERRADO ou EM_ANDAMENTO',
      );
    }

    const statusAtual = edital.status_edital;

    if (novoStatus === 'ABERTO' || novoStatus === 'EM_ANDAMENTO') {
      if (!isEditalComplete(edital)) {
        throw new StatusEditalInvalidoError(
          'Para alterar o status para ABERTO ou EM_ANDAMENTO, todos os dados do edital devem estar preenchidos',
        );
      }
    }

    if (novoStatus === 'ENCERRADO') {
      if (statusAtual !== 'ABERTO' && statusAtual !== 'EM_ANDAMENTO') {
        throw new StatusEditalInvalidoError(
          'Só é possível alterar para ENCERRADO se o edital estiver ABERTO ou EM_ANDAMENTO',
        );
      }
    }

    const updated = await this.editalRepository.updateStatus(id, novoStatus);
    return {
      id: updated.id,
      titulo_edital: updated.titulo_edital,
      descricao: updated.descricao,
      edital_url: updated.edital_url,
      status_edital: updated.status_edital,
      etapa_edital: updated.etapa_edital,
      nivel_academico: updated.nivel_academico,
      created_at: updated.created_at,
      updated_at: updated.updated_at,
    };
  }
}
