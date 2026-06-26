export interface PdfRendererPort {
  /** Inscrições com status de análise = Inscrição Aprovada */
  generateAprovadosPdf(editalId?: number): Promise<Buffer>;
  /** Inscrições homologadas como beneficiário no edital (vaga) */
  generateBeneficiariosPdf(editalId: number): Promise<Buffer>;
  /** PDF detalhado de uma única inscrição: dados do aluno + perguntas/respostas */
  generateInscricaoDetalhePdf(inscricaoId: number): Promise<Buffer>;
}

