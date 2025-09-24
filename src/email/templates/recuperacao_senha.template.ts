export const recuperacaoSenhaTemplate = (token: string): string => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/reset-password?token=${token}`;
  
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recuperação de Senha - PROAE</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #183b4e 0%, #2c5f75 100%);
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            color: #ffffff;
            font-size: 28px;
            margin-bottom: 10px;
            font-weight: 600;
        }
        
        .header p {
            color: #e8ebf7;
            font-size: 16px;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .greeting {
            font-size: 18px;
            color: #2c3e50;
            margin-bottom: 20px;
            font-weight: 500;
        }
        
        .message {
            font-size: 16px;
            color: #555;
            margin-bottom: 30px;
            line-height: 1.7;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #183b4e 0%, #2c5f75 100%);
            color: #ffffff !important;
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            text-align: center;
            margin: 20px 0;
            transition: transform 0.2s ease;
            box-shadow: 0 4px 15px rgba(24, 59, 78, 0.3);
        }
        
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(24, 59, 78, 0.4);
        }
        
        .security-info {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 6px;
            padding: 20px;
            margin: 30px 0;
        }
        
        .security-info h3 {
            color: #856404;
            font-size: 16px;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
        }
        
        .security-info p {
            color: #856404;
            font-size: 14px;
            line-height: 1.5;
        }
        
        .token-info {
            background-color: #f8f9fa;
            border-left: 4px solid #183b4e;
            padding: 15px;
            margin: 20px 0;
            border-radius: 0 6px 6px 0;
        }
        
        .token-info p {
            font-size: 14px;
            color: #6c757d;
            margin: 5px 0;
        }
        
        .footer {
            background-color: #2c3e50;
            color: #ffffff;
            padding: 30px;
            text-align: center;
        }
        
        .footer h3 {
            font-size: 18px;
            margin-bottom: 15px;
            color: #ecf0f1;
        }
        
        .footer p {
            font-size: 14px;
            color: #bdc3c7;
            margin-bottom: 10px;
        }
        
        .footer .contact-info {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #34495e;
        }
        
        .footer .contact-info p {
            font-size: 13px;
            margin: 5px 0;
        }
        
        @media only screen and (max-width: 600px) {
            .container {
                margin: 0;
                border-radius: 0;
            }
            
            .header, .content, .footer {
                padding: 20px;
            }
            
            .header h1 {
                font-size: 24px;
            }
            
            .cta-button {
                display: block;
                text-align: center;
                margin: 20px 0;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>🔐 PROAE - UFBA</h1>
            <p>Pró-Reitoria de Ações Afirmativas e Assistência Estudantil</p>
        </div>
        
        <!-- Content -->
        <div class="content">
            <div class="greeting">
                Olá, estudante! 👋
            </div>
            
            <div class="message">
                Recebemos uma solicitação para redefinir a senha da sua conta no sistema PROAE. 
                Se você fez essa solicitação, clique no botão abaixo para criar uma nova senha:
            </div>
            
            <div style="text-align: center;">
                <a href="${resetUrl}" class="cta-button">
                    🔑 Redefinir Minha Senha
                </a>
            </div>
            
            <div class="security-info">
                <h3>🛡️ Informações de Segurança</h3>
                <p>
                    • Este link é válido por <strong>1 hora</strong> a partir do momento desta solicitação<br>
                    • Use apenas este link oficial para redefinir sua senha<br>
                    • Nunca compartilhe este link com outras pessoas<br>
                    • Caso não tenha solicitado esta redefinição, ignore este email
                </p>
            </div>
            
            <div class="message">
                <strong>Não solicitou esta redefinição?</strong><br>
                Se você não solicitou a redefinição de senha, pode ignorar este email com segurança. 
                Sua senha atual permanecerá inalterada.
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <h3>📚 PROAE - UFBA</h3>
            <p>Universidade Federal da Bahia</p>
            <p>Pró-Reitoria de Ações Afirmativas e Assistência Estudantil</p>
            
            <div class="contact-info">
                <p><strong>Precisa de ajuda?</strong></p>
                <p>📧 Email: proae@ufba.br</p>
                <p>📞 Telefone: (71) 3283-5714</p>
                <p>🌐 Site: www.proae.ufba.br</p>
                <p style="margin-top: 15px; color: #95a5a6;">
                    Este é um email automático, não responda diretamente.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
  `;
};
