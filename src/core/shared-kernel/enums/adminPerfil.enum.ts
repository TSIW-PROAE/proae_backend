/**
 * Perfis de acesso do servidor PROAE (administrativo).
 *
 * - tecnico:    análise das inscrições; consulta dos editais; sem permissão para
 *               criar, publicar ou editar editais nem alterar a configuração do sistema.
 * - gerencial:  criação, gestão e publicação dos editais e gerenciamento das informações.
 * - coordenacao: somente leitura — visualização geral, sem edição ou gerenciamento.
 */
export enum AdminPerfilEnum {
  TECNICO = 'tecnico',
  GERENCIAL = 'gerencial',
  COORDENACAO = 'coordenacao',
}

/** Lista canônica de perfis válidos. */
export const ADMIN_PERFIS_VALIDOS: AdminPerfilEnum[] = [
  AdminPerfilEnum.TECNICO,
  AdminPerfilEnum.GERENCIAL,
  AdminPerfilEnum.COORDENACAO,
];

/** Devolve o enum correspondente, ou null se a string for inválida/vazia. */
export function parseAdminPerfil(
  value: string | null | undefined,
): AdminPerfilEnum | null {
  if (value == null) return null;
  const v = String(value).trim().toLowerCase();
  if (v === '') return null;
  if (v === AdminPerfilEnum.TECNICO) return AdminPerfilEnum.TECNICO;
  if (v === AdminPerfilEnum.GERENCIAL) return AdminPerfilEnum.GERENCIAL;
  if (v === AdminPerfilEnum.COORDENACAO) return AdminPerfilEnum.COORDENACAO;
  return null;
}

/**
 * Resolve o perfil efetivo para um admin existente. Mantém compatibilidade com
 * cadastros antigos (sem coluna preenchida): assume `gerencial`, comportamento
 * idêntico ao que existia antes da introdução dos perfis.
 */
export function resolveAdminPerfilEfetivo(
  raw: string | null | undefined,
): AdminPerfilEnum {
  return parseAdminPerfil(raw) ?? AdminPerfilEnum.GERENCIAL;
}
