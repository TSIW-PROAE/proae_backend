export function adminApprovalTemplate(emailNovoAdmin: string, token: string) {
  const baseUrl = process.env.BACKEND_URL || 'http://localhost:3000';
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
