/**
 * Email enviado ao novo admin quando um administrador aprova o cadastro.
 * Inclui link direto para a página de login do frontend.
 */
export function adminAprovadoTemplate(loginUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cadastro Aprovado - PROAE</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f4f4f4;">
  <div style="max-width:600px;margin:0 auto;background:#fff;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#183b4e 0%,#2c5f75 100%);padding:24px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;">PROAE - UFBA</h1>
      <p style="color:#e8ebf7;margin:8px 0 0;font-size:14px;">Cadastro aprovado</p>
    </div>
    <div style="padding:32px 24px;">
      <h2 style="color:#2c3e50;margin:0 0 16px;font-size:20px;">Seu cadastro foi aprovado</h2>
      <p style="color:#555;line-height:1.6;margin:0 0 24px;">
        Sua solicitação de acesso como administrador foi aprovada. Você já pode acessar o sistema com seu e-mail e senha.
      </p>
      <p style="text-align:center;margin:24px 0;">
        <a href="${loginUrl}" style="display:inline-block;background:linear-gradient(135deg,#183b4e,#2c5f75);color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;">Acessar o sistema</a>
      </p>
      <p style="color:#666;font-size:14px;margin:24px 0 0;">
        Se o botão não funcionar, copie e cole no navegador:<br>
        <a href="${loginUrl}" style="color:#183b4e;">${loginUrl}</a>
      </p>
    </div>
    <div style="background:#2c3e50;color:#bdc3c7;padding:20px;text-align:center;font-size:12px;">
      PROAE - UFBA. Este é um e-mail automático.
    </div>
  </div>
</body>
</html>
  `.trim();
}
