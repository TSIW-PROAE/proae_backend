/** Utilitários de semestre letivo para vigência do Cadastro Geral (semestre apto + 4 seguintes). */

export interface SemestreParsed {
  year: number;
  term: 1 | 2;
}

export function parseSemestre(value: string | null | undefined): SemestreParsed | null {
  const s = String(value ?? '').trim();
  const m = /^(\d{4})\.([12])$/.exec(s);
  if (!m) return null;
  return { year: Number(m[1]), term: Number(m[2]) as 1 | 2 };
}

export function formatSemestre(year: number, term: 1 | 2): string {
  return `${year}.${term}`;
}

/** Estimativa do semestre letivo corrente (calendário UFBA aproximado). */
export function getSemestreAtual(date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const term: 1 | 2 = month <= 7 ? 1 : 2;
  return formatSemestre(year, term);
}

export function compareSemestre(a: string, b: string): number {
  const pa = parseSemestre(a);
  const pb = parseSemestre(b);
  if (!pa || !pb) return 0;
  if (pa.year !== pb.year) return pa.year - pb.year;
  return pa.term - pb.term;
}

/** Soma `quantidade` semestres ao semestre base (ex.: 2026.1 + 4 → 2027.1). */
export function addSemestres(base: string, quantidade: number): string {
  const parsed = parseSemestre(base) ?? parseSemestre(getSemestreAtual())!;
  let { year, term } = parsed;
  let rest = quantidade;
  while (rest > 0) {
    if (term === 1) {
      term = 2;
    } else {
      term = 1;
      year += 1;
    }
    rest -= 1;
  }
  return formatSemestre(year, term);
}

export function isCgVigente(opts: {
  cgSituacao: string | null | undefined;
  cgValidoAteSemestre: string | null | undefined;
  now?: Date;
}): boolean {
  const situacao = String(opts.cgSituacao ?? '').trim();
  if (situacao !== 'Apto') return false;
  const limite = String(opts.cgValidoAteSemestre ?? '').trim();
  if (!limite) return true;
  return compareSemestre(getSemestreAtual(opts.now), limite) <= 0;
}

/** Extrai semestre do título/descrição do edital (ex.: "2026.1") ou usa o atual. */
export function inferirSemestreReferencia(...fontes: Array<string | null | undefined>): string {
  for (const fonte of fontes) {
    const s = String(fonte ?? '');
    const m = /(20\d{2})\.([12])/.exec(s);
    if (m) return `${m[1]}.${m[2]}`;
  }
  return getSemestreAtual();
}
