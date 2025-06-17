type FormatWithPlaceholder = {
  format: string;
  placeholder: string;
};

export enum EnumInputFormat {
  PHONE = 'phone', // (00) 00000-0000
  DATA_MES = 'dataMes', // 00/0000
  DATA_COMPLETA = 'dataCompleta', // 00/00/0000
  CPF = 'cpf', // 000.000.000-00
  CEP = 'cep', // 00000-000
  CNPJ = 'cnpj', // 00.000.000/0000-00
  RG = 'rg', // 00.000.000-0
  MOEDA = 'moeda', // R$ 0.000,00
  //PERSONALIZADO = 'personalizado',
  SINGLE_SELECT = 'single-select',
  MULTI_SELECT = 'multi-select',
  NONE = "none"
}

export const InputFormatPlaceholders: Record<EnumInputFormat, string> = {
  [EnumInputFormat.PHONE]: '(00) 00000-0000',
  [EnumInputFormat.DATA_MES]: '00/0000',
  [EnumInputFormat.DATA_COMPLETA]: '00/00/0000',
  [EnumInputFormat.CPF]: '000.000.000-00',
  [EnumInputFormat.CEP]: '00000-000',
  [EnumInputFormat.CNPJ]: '00.000.000/0000-00',
  [EnumInputFormat.RG]: '00.000.000-0',
  [EnumInputFormat.MOEDA]: 'R$ 0.000,00',
  [EnumInputFormat.SINGLE_SELECT]: 'Selecione uma opção',
  [EnumInputFormat.MULTI_SELECT]: 'Selecione pelo menos uma opção',
  [EnumInputFormat.NONE]: 'Sua resposta'
};