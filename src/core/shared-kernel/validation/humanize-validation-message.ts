/** Rótulos amigáveis para nomes de campos da API. */
const FIELD_LABELS: Record<string, string> = {
  data_nascimento: 'Data de nascimento',
  data_ingresso: 'Data de ingresso',
  data_inicio: 'Data de início',
  data_fim: 'Data de fim',
  data_fim_vigencia: 'Data de fim da vigência',
  email: 'E-mail',
  senha: 'Senha',
  cpf: 'CPF',
  celular: 'Celular',
  nome: 'Nome',
  cargo: 'Cargo',
  perfil: 'Perfil de acesso',
  matricula: 'Matrícula',
  curso: 'Curso',
  campus: 'Campus',
};

const REPLACEMENTS: [RegExp, string][] = [
  [/must be a valid ISO 8601 date string/gi, 'informe uma data válida (dia, mês e ano)'],
  [/ISO 8601/gi, 'data válida'],
  [/ISO string/gi, 'data válida'],
  [/must be a valid phone number/gi, 'informe um celular brasileiro com DDD (ex.: (71) 99999-9999)'],
  [/must be an email/gi, 'informe um e-mail válido'],
  [/must be a string/gi, 'preencha este campo com texto'],
  [/must be a number/gi, 'informe um número válido'],
  [/should not exist/gi, 'não é permitido neste formulário'],
  [/must be one of the following values/gi, 'escolha uma opção válida na lista'],
  [/Senha deve ser forte e não ter sido vazada anteriormente/gi, 'escolha uma senha mais forte (misture letras, números e símbolos)'],
];

function labelForField(field?: string): string | null {
  if (!field) return null;
  const key = field.split('.').pop() ?? field;
  return FIELD_LABELS[key] ?? null;
}

/**
 * Converte mensagens técnicas do class-validator (inglês/jargão) em texto para o usuário.
 */
export function humanizeValidationMessage(
  raw: string,
  field?: string,
): string {
  let msg = (raw ?? '').trim();
  if (!msg) return 'Revise os dados informados e tente novamente.';

  const label = labelForField(field);

  for (const [pattern, replacement] of REPLACEMENTS) {
    msg = msg.replace(pattern, replacement);
  }

  // "data_nascimento must be ..." → frase com rótulo em português
  if (field && /^[a-z0-9_.]+ must /i.test(msg)) {
    const rest = msg.replace(/^[a-z0-9_.]+\s+must\s+/i, '');
    if (label) {
      return `${label}: ${rest.charAt(0).toLowerCase()}${rest.slice(1)}`;
    }
  }

  if (field && msg.startsWith(field)) {
    const rest = msg.slice(field.length).replace(/^\s*must\s+/i, '').trim();
    if (label && rest) {
      return `${label}: ${rest.charAt(0).toLowerCase()}${rest.slice(1)}`;
    }
  }

  if (label && !msg.toLowerCase().includes(label.toLowerCase())) {
    const lower = msg.charAt(0).toLowerCase() + msg.slice(1);
    if (lower.length < 120) return `${label}: ${lower}`;
  }

  return msg.charAt(0).toUpperCase() + msg.slice(1);
}
