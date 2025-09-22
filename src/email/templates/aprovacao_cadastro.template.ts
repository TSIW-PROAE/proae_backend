export function adminApprovalTemplate(emailNovoAdmin: string, token: string) {
  const approveUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/auth/approve-admin/${token}`;
  const rejectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/auth/reject-admin/${token}`;

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
