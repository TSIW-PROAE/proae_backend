import { BadRequestException } from '@nestjs/common';
import {
  NivelAcademico,
  parseNivelAcademico,
} from 'src/core/shared-kernel/enums/enumNivelAcademico';

/**
 * Query `nivel_academico` em rotas admin/listagens.
 * Vazio ou omitido → Graduação (compatível com dados legados).
 */
export function resolveNivelAcademicoQuery(raw?: string): NivelAcademico {
  if (raw == null || String(raw).trim() === '') {
    return NivelAcademico.GRADUACAO;
  }
  const p = parseNivelAcademico(raw);
  if (!p) {
    throw new BadRequestException(
      'Parâmetro nivel_academico inválido. Use "Graduação" ou "Pós-graduação".',
    );
  }
  return p;
}
