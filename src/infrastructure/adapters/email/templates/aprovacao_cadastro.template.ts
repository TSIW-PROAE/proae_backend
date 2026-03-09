export function adminApprovalTemplate(emailNovoAdmin: string, token: string) {
  let baseUrl = process.env.BACKEND_URL || 'http://localhost:3000';
  // Em localhost, usar sempre HTTP (backend não tem SSL em dev) para evitar ERR_SSL_PROTOCOL_ERROR
  try {
    const u = new URL(baseUrl);
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
      baseUrl = baseUrl.replace(/^https:/i, 'http:');
    }
  } catch {
    /* fallback: manter baseUrl */
  }
  const approveUrl = `${baseUrl}/auth/approve-admin/${token}`;
  const rejectUrl = `${baseUrl}/auth/reject-admin/${token}`;

  return `
    <h2>Pedido de Cadastro de Novo Admin</h2>
    <p>Um novo administrador solicitou acesso ao sistema com o email: <b>${emailNovoAdmin}</b>.</p>
    <p>Você pode aprovar ou rejeitar o pedido abaixo:</p>
    <p>
      <a href="${approveUrl}">✅ Aprovar</a> | 
      <a href="${rejectUrl}">❌ Rejeitar</a>
    </p>
    <p>Esse link expira em 24 horas.</p>
  `;
}
