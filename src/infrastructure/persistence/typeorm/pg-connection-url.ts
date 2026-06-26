/**
 * Ajusta `sslmode` na connection string para evitar o aviso do driver `pg` v8+:
 * prefer / require / verify-ca passam a ser tratados como verify-full.
 *
 * @see https://www.postgresql.org/docs/current/libpq-ssl.html
 */
export function normalizePgConnectionUrl(raw: string | undefined | null): string {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return trimmed;

  if (/([?&])sslmode=(prefer|require|verify-ca)(?=&|$)/i.test(trimmed)) {
    return trimmed.replace(
      /([?&])sslmode=(prefer|require|verify-ca)(?=&|$)/gi,
      '$1sslmode=verify-full',
    );
  }

  // URL remota sem sslmode explícito (ex.: alguns hosts Neon) — define verify-full.
  if (!/([?&])sslmode=/i.test(trimmed) && !trimmed.includes('localhost')) {
    const sep = trimmed.includes('?') ? '&' : '?';
    return `${trimmed}${sep}sslmode=verify-full`;
  }

  return trimmed;
}
