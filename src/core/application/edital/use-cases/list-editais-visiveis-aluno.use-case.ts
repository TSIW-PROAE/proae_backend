import { Inject, Injectable } from '@nestjs/common';
import type { IEditalRepository } from '../ports/edital.repository.port';
import { EDITAL_REPOSITORY } from '../edital.tokens';

/**
 * Lista os editais que devem aparecer no portal do aluno: além dos
 * `ABERTO` (passíveis de inscrição), também os `EM_ANDAMENTO` e `ENCERRADO`,
 * para que o estudante consiga acompanhar processos passados.
 *
 * As regras de inscrição/correção continuam restritas a `ABERTO` no
 * `inscricao.service` e `inscricao.repository` — este caso de uso é apenas
 * de leitura/visualização.
 */
@Injectable()
export class ListEditaisVisiveisAlunoUseCase {
  constructor(
    @Inject(EDITAL_REPOSITORY)
    private readonly editalRepository: IEditalRepository,
  ) {}

  async execute(nivelAcademico?: string) {
    const editais = await this.editalRepository.findVisiveisParaAluno(
      nivelAcademico,
    );
    return editais.map((e) => ({
      id: e.id,
      titulo_edital: e.titulo_edital,
      descricao: e.descricao,
      edital_url: e.edital_url,
      status_edital: e.status_edital,
      etapa_edital: e.etapa_edital,
      nivel_academico: e.nivel_academico,
      data_fim_vigencia: e.data_fim_vigencia
        ? new Date(e.data_fim_vigencia as Date).toISOString().slice(0, 10)
        : null,
      created_at: e.created_at,
      updated_at: e.updated_at,
      quantidade_bolsas: e.quantidade_bolsas ?? 0,
      numero_beneficios: e.numero_beneficios ?? 0,
    }));
  }
}
