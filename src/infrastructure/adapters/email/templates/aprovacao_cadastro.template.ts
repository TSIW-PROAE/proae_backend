function resolveBaseUrl(): string {
  let baseUrl = (process.env.BACKEND_URL || 'http://localhost:3000')
    .trim()
    .replace(/\/+$/, '');
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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function emailActionButton(
  href: string,
  label: string,
  variant: 'primary' | 'secondary' | 'danger' = 'primary',
): string {
  const styles: Record<'primary' | 'secondary' | 'danger', string> = {
    primary:
      'background:linear-gradient(135deg,#183b4e,#2c5f75);color:#ffffff;border:1px solid #183b4e;',
    secondary:
      'background:#f8fafc;color:#183b4e;border:1px solid #cbd5e1;',
    danger:
      'background:#fef2f2;color:#b91c1c;border:1px solid #fecaca;',
  };

  return `
    <a href="${href}" style="display:block;text-decoration:none;padding:13px 18px;border-radius:8px;font-weight:600;font-size:14px;text-align:center;margin:0 0 10px;${styles[variant]}">
      ${label}
    </a>
  `.trim();
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
  const approveDefault = approveBase;

  const emailSafe = escapeHtml(emailNovoAdmin);
  const perfilSafe = escapeHtml(labelPerfil(perfilPretendido));

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pedido de Cadastro - PROAE</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#f4f4f4;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#183b4e 0%,#2c5f75 100%);padding:24px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:24px;">PROAE - UFBA</h1>
      <p style="color:#e8ebf7;margin:8px 0 0;font-size:14px;">Pedido de cadastro de servidor</p>
    </div>

    <div style="padding:32px 24px;">
      <h2 style="color:#2c3e50;margin:0 0 16px;font-size:20px;">Nova solicitação de acesso</h2>
      <p style="color:#555;line-height:1.6;margin:0 0 20px;">
        Um novo servidor solicitou acesso ao painel administrativo do sistema. Revise os dados abaixo e escolha uma ação.
      </p>

      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 18px;margin:0 0 28px;">
        <p style="margin:0 0 10px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;font-weight:700;">
          Dados do solicitante
        </p>
        <p style="margin:0 0 8px;color:#334155;font-size:14px;line-height:1.5;">
          <strong style="color:#183b4e;">E-mail:</strong> ${emailSafe}
        </p>
        <p style="margin:0;color:#334155;font-size:14px;line-height:1.5;">
          <strong style="color:#183b4e;">Perfil solicitado:</strong> ${perfilSafe}
        </p>
      </div>

      <h3 style="color:#183b4e;margin:0 0 8px;font-size:16px;">Aprovar cadastro</h3>
      <p style="color:#555;line-height:1.6;margin:0 0 14px;font-size:14px;">
        Confirme o perfil indicado pelo candidato ou selecione outro perfil de acesso:
      </p>

      ${emailActionButton(approveDefault, 'Aprovar com o perfil solicitado', 'primary')}
      ${emailActionButton(approveAsTecnico, 'Aprovar como Técnico (análise)', 'secondary')}
      ${emailActionButton(approveAsGerencial, 'Aprovar como Gerencial (editais e equipe)', 'secondary')}
      ${emailActionButton(approveAsCoordenacao, 'Aprovar como Coordenação (consulta)', 'secondary')}

      <div style="border-top:1px solid #e2e8f0;margin:24px 0;"></div>

      <h3 style="color:#b91c1c;margin:0 0 8px;font-size:16px;">Rejeitar pedido</h3>
      <p style="color:#555;line-height:1.6;margin:0 0 14px;font-size:14px;">
        Caso a solicitação não deva ser homologada, utilize a opção abaixo:
      </p>
      ${emailActionButton(rejectUrl, 'Rejeitar este pedido', 'danger')}

      <p style="color:#64748b;font-size:12px;line-height:1.6;margin:24px 0 0;padding:14px 16px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;">
        Os endereços de ação expiram em <strong>24 horas</strong>. Após a aprovação, o perfil ainda pode ser alterado por um administrador gerencial na tela <strong>Equipe PROAE</strong>.
      </p>
    </div>

    <div style="background:#2c3e50;color:#bdc3c7;padding:20px;text-align:center;font-size:12px;line-height:1.5;">
      PROAE - UFBA · Pró-Reitoria de Ações Afirmativas e Assistência Estudantil<br>
      Este é um e-mail automático. Não responda a esta mensagem.
    </div>
  </div>
</body>
</html>
  `.trim();
}
