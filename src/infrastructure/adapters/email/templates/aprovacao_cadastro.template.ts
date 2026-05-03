function resolveBaseUrl(): string {
  let baseUrl = (process.env.BACKEND_URL || 'http://localhost:3000')
    .trim()
    .replace(/\/+$/, '');
  // Em localhost, usar sempre HTTP (backend não tem SSL em dev) para evitar ERR_SSL_PROTOCOL_ERROR
  try {
    const u = new URL(baseUrl);
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
      baseUrl = baseUrl.replace(/^https:/i, 'http:');
    }
  } catch {
    /* fallback: manter baseUrl */
  }
  return baseUrl;
}

const PERFIL_LABELS: Record<string, string> = {
  tecnico: 'Técnico (análise, sem gestão de editais)',
  gerencial: 'Gerencial (criação e gestão de editais)',
  coordenacao: 'Coordenação (somente consulta)',
};

function labelPerfil(p?: string | null): string {
  if (!p) return 'Não informado';
  const k = String(p).trim().toLowerCase();
  return PERFIL_LABELS[k] ?? 'Não informado';
}

export function adminApprovalTemplate(
  emailNovoAdmin: string,
  token: string,
  perfilPretendido?: string | null,
) {
  const baseUrl = resolveBaseUrl();
  const approveBase = `${baseUrl}/auth/approve-admin/${token}`;
  const rejectUrl = `${baseUrl}/auth/reject-admin/${token}`;

  const approveAsTecnico = `${approveBase}?perfil=tecnico`;
  const approveAsGerencial = `${approveBase}?perfil=gerencial`;
  const approveAsCoordenacao = `${approveBase}?perfil=coordenacao`;
  // Mantém a aprovação "padrão" (usa o que o candidato escolheu) para compatibilidade
  const approveDefault = approveBase;

  return `
    <h2>Pedido de Cadastro de Novo Admin</h2>
    <p>Um novo administrador solicitou acesso ao sistema com o email: <b>${emailNovoAdmin}</b>.</p>
    <p>Perfil de acesso solicitado pelo candidato: <b>${labelPerfil(perfilPretendido)}</b>.</p>

    <h3 style="margin-top:24px;">Aprovar</h3>
    <p>Você pode confirmar o perfil solicitado ou escolher outro:</p>
    <ul style="line-height:1.8;">
      <li><a href="${approveDefault}">✅ Aprovar mantendo o perfil solicitado</a></li>
      <li><a href="${approveAsTecnico}">👤 Aprovar como <b>Técnico</b> (análise)</a></li>
      <li><a href="${approveAsGerencial}">🛠️ Aprovar como <b>Gerencial</b> (gestão de editais)</a></li>
      <li><a href="${approveAsCoordenacao}">📊 Aprovar como <b>Coordenação</b> (somente consulta)</a></li>
    </ul>

    <h3 style="margin-top:24px;">Rejeitar</h3>
    <p><a href="${rejectUrl}">❌ Rejeitar este pedido</a></p>

    <p style="margin-top:24px;color:#475569;font-size:12px;">Esse link expira em 24 horas. Após a aprovação, o perfil ainda pode ser alterado por qualquer admin gerencial na tela "Equipe PROAE".</p>
  `;
}
