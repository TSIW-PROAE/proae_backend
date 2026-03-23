/**
 * Nível do estudante e do edital (processos separados: Graduação × Pós-graduação).
 */
export enum NivelAcademico {
  GRADUACAO = 'Graduação',
  POS_GRADUACAO = 'Pós-graduação',
}

export function parseNivelAcademico(
  raw: string | undefined | null,
): NivelAcademico | null {
  if (raw == null || String(raw).trim() === '') return null;
  const t = String(raw).trim();
  if (t === NivelAcademico.GRADUACAO || t.toLowerCase() === 'graduacao')
    return NivelAcademico.GRADUACAO;
  if (
    t === NivelAcademico.POS_GRADUACAO ||
    t.toLowerCase().includes('pós') ||
    t.toLowerCase().includes('pos-graduacao') ||
    t.toLowerCase() === 'posgraduacao'
  )
    return NivelAcademico.POS_GRADUACAO;
  return null;
}
