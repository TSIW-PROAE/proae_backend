/** Link aponta para o backend; o usuário é redirecionado ao front após confirmar. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const confirmacaoCadastroAlunoTemplate = (
  confirmUrl: string,
): string => {
  const confirmUrlSafe = escapeHtml(confirmUrl);

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirme seu cadastro - PROAE UFBA</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#f4f4f4;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#183b4e 0%,#2c5f75 100%);padding:24px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:24px;">PROAE - UFBA</h1>
      <p style="color:#e8ebf7;margin:8px 0 0;font-size:14px;">Confirmação de cadastro de estudante</p>
    </div>

    <div style="padding:32px 24px;">
      <h2 style="color:#2c3e50;margin:0 0 16px;font-size:20px;">Confirme seu e-mail</h2>
      <p style="color:#555;line-height:1.6;margin:0 0 16px;">
        Você se cadastrou no sistema da PROAE como <strong>estudante</strong>.
        Para ativar seu acesso ao portal do aluno, confirme seu endereço eletrônico clicando no botão abaixo:
      </p>

      <p style="text-align:center;margin:24px 0;">
        <a href="${confirmUrl}" style="display:inline-block;background:linear-gradient(135deg,#183b4e,#2c5f75);color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;">
          Confirmar meu e-mail
        </a>
      </p>

      <p style="color:#666;font-size:14px;line-height:1.6;margin:24px 0 0;">
        Se o botão não funcionar, copie e cole no navegador:<br>
        <a href="${confirmUrl}" style="color:#183b4e;word-break:break-all;">${confirmUrlSafe}</a>
      </p>

      <p style="color:#64748b;font-size:12px;line-height:1.6;margin:24px 0 0;padding:14px 16px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;">
        O endereço de confirmação expira em <strong>48 horas</strong>.
        Se você não solicitou este cadastro, ignore este e-mail — nenhuma ação será realizada.
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
};
