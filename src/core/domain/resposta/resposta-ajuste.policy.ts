/**
 * Regra única para "resposta ainda precisa de ajuste pelo aluno":
 * usada em pendências (`DocumentoTypeOrmRepository`) e em
 * `POST /inscricoes` (merge de complemento).
 */
export interface RespostaAjusteFields {
  perguntaAdicionadaPosInscricao?: boolean;
  valorTexto?: string | null;
  urlArquivo?: string | null;
  valorOpcoes?: string[] | null;
  prazoRespostaNovaPergunta?: Date | null;
  requerReenvio?: boolean;
  prazoReenvio?: Date | null;
}

export function respostaPrecisaAjuste(r: RespostaAjusteFields): boolean {
  if (r.perguntaAdicionadaPosInscricao) {
    const respondeu =
      !!r.valorTexto ||
      !!r.urlArquivo ||
      (Array.isArray(r.valorOpcoes) && r.valorOpcoes.length > 0);
    if (respondeu) return false;
    if (r.prazoRespostaNovaPergunta != null) {
      const fim = new Date(r.prazoRespostaNovaPergunta);
      if (!Number.isNaN(fim.getTime()) && fim.getTime() < Date.now()) {
        return false;
      }
    }
    return true;
  }

  if (!r.requerReenvio) return false;
  if (r.prazoReenvio != null) {
    const fim = new Date(r.prazoReenvio);
    if (!Number.isNaN(fim.getTime()) && fim.getTime() < Date.now()) {
      return false;
    }
  }
  return true;
}

export function inscricaoTemRespostaPrecisandoAjuste(ins: {
  respostas?: RespostaAjusteFields[] | null;
}): boolean {
  for (const x of ins.respostas ?? []) {
    if (respostaPrecisaAjuste(x)) return true;
  }
  return false;
}
