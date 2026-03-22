/** Link aponta para o backend; o usuário é redirecionado ao front após confirmar. */
export const confirmacaoCadastroAlunoTemplate = (
  confirmUrl: string,
): string => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirme seu cadastro - PROAE UFBA</title>
</head>
<body style="margin:0;font-family:Arial,sans-serif;background:#f4f4f4;color:#333;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:24px 12px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#183b4e 0%,#2c5f75 100%);padding:28px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:22px;">PROAE — UFBA</h1>
              <p style="color:#e0eef3;margin:8px 0 0;font-size:14px;">Confirmação de cadastro de estudante</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 24px;">
              <p style="line-height:1.6;margin:0 0 16px;">Olá,</p>
              <p style="line-height:1.6;margin:0 0 16px;">
                Você se cadastrou no sistema da PROAE como <strong>estudante</strong>.
                Para ativar seu acesso ao portal do aluno, confirme seu email clicando no botão abaixo:
              </p>
              <p style="text-align:center;margin:28px 0;">
                <a href="${confirmUrl}"
                   style="display:inline-block;background:#183b4e;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:bold;">
                  Confirmar meu email
                </a>
              </p>
              <p style="font-size:13px;color:#666;line-height:1.5;margin:0 0 12px;">
                Se o botão não funcionar, copie e cole este link no navegador:<br/>
                <span style="word-break:break-all;color:#2c5f75;">${confirmUrl}</span>
              </p>
              <p style="font-size:12px;color:#999;margin:20px 0 0;">
                Este link expira em 48 horas. Se você não solicitou este cadastro, ignore este email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
