/**
 * Situação do estudante quanto ao **benefício no edital** (vaga / seleção final).
 * Independe do status de **análise da inscrição** (`StatusInscricao`).
 */
export enum StatusBeneficioEdital {
  /** Ainda não definido se será beneficiário no edital */
  PENDENTE_SELECAO = 'Pendente seleção',
  /** Homologado como beneficiário daquele edital/vaga */
  BENEFICIARIO = 'Beneficiário no edital',
  /** Inscrição pode estar aprovada na análise, mas não foi selecionado para o benefício */
  NAO_BENEFICIARIO = 'Não beneficiário',
}
