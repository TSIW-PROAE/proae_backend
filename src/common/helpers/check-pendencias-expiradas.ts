import type { EntityManager } from 'typeorm';
import { StatusInscricao } from '../../enum/enumStatusInscricao';
import { Logger } from '@nestjs/common';

const logger = new Logger('CheckPendenciasExpiradas');

/**
 * Verifica e atualiza pendências expiradas de forma eficiente via bulk SQL.
 *
 * Lógica:
 * 1. Atualiza para REJEITADA todas as inscrições "Pendente de Regularização"
 *    que possuem ao menos uma resposta com prazoReenvio vencido.
 * 2. Marca essas respostas como sem direito de reenvio (requerReenvio = false).
 *
 * Complexidade: O(1) no nível da aplicação — apenas 2 queries bulk.
 * O banco de dados resolve a filtragem com index scans.
 * Nenhum dado é carregado para a memória da aplicação.
 */
export async function checkPendenciasExpiradas(
  entityManager: EntityManager,
): Promise<void> {
  try {
    // Query 1: Rejeitar inscrições que possuem respostas com prazo vencido
    await entityManager.query(
      `UPDATE inscricao
       SET status_inscricao = $1
       WHERE status_inscricao = $2
         AND id IN (
           SELECT DISTINCT "inscricaoId"
           FROM resposta
           WHERE "requerReenvio" = true
             AND "prazoReenvio" IS NOT NULL
             AND "prazoReenvio" < NOW()
         )`,
      [StatusInscricao.REJEITADA, StatusInscricao.PENDENTE_REGULARIZACAO],
    );

    // Query 2: Marcar respostas expiradas como sem direito de reenvio.
    // NÃO limpa parecer nem prazoReenvio — o frontend interpreta:
    //   invalidada=true + requerReenvio=false + prazoReenvio preenchido
    //   = "Resposta invalidada definitivamente por prazo expirado"
    await entityManager.query(
      `UPDATE resposta
       SET "requerReenvio" = false
       WHERE "requerReenvio" = true
         AND "prazoReenvio" IS NOT NULL
         AND "prazoReenvio" < NOW()`,
    );
  } catch (error) {
    // Não propagar erro — este check não deve impedir a resposta principal
    logger.error('Falha ao verificar pendências expiradas', error);
  }
}
