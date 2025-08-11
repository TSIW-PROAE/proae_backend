// Carregar variáveis de ambiente
require('dotenv').config();

const nodemailer = require('nodemailer');

// Configurações que você pode alterar aqui
const config = {
  host: 'smtp.gmail.com',
  port: 587, // Tentar porta 587 primeiro (TLS)
  secure: false, // false para TLS, true para SSL
  auth: {
    user: process.env.GMAIL_USER || 'proaesistema@gmail.com',
    pass: process.env.GMAIL_PASS || 'sistemaproae2025!',
  },
};

console.log('🔧 Configurações atuais:');
console.log('   Host:', config.host);
console.log('   Port:', config.port);
console.log('   Secure:', config.secure);
console.log('   User:', config.auth.user);
console.log('   Pass:', config.auth.pass ? '***' + config.auth.pass.slice(-4) : 'Não configurado');
console.log('');

// Criar transporter
const transporter = nodemailer.createTransport(config);

// Template simples
const createSimpleTemplate = () => `
<!DOCTYPE html>
<html>
<head>
  <title>Teste Simples</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; background-color: #f0f0f0; }
    .container { max-width: 500px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background-color: #007bff; color: white; padding: 15px; text-align: center; border-radius: 5px; margin-bottom: 20px; }
    .success { color: #28a745; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Email Funcionando!</h1>
    </div>
    <p>Olá! Este é um email de teste do sistema PROAE.</p>
    <p class="success">Se você recebeu este email, o sistema está funcionando perfeitamente! 🎉</p>
    <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
    <p><strong>Servidor:</strong> ${config.host}:${config.port}</p>
  </div>
</body>
</html>
`;

// Função de teste
async function testSimple() {
  try {
    console.log('🚀 Iniciando teste...');
    
    // Testar conexão
    console.log('🔌 Testando conexão...');
    await transporter.verify();
    console.log('✅ Conexão estabelecida!');
    
    // Enviar email
    console.log('📧 Enviando email...');
    const info = await transporter.sendMail({
      from: `"Teste PROAE" <${config.auth.user}>`,
      to: config.auth.user, // Enviar para você mesmo
      subject: '🧪 Teste Simples - PROAE',
      html: createSimpleTemplate(),
    });
    
    console.log('✅ Email enviado com sucesso!');
    console.log('📧 ID:', info.messageId);
    console.log('📬 Para:', config.auth.user);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n🔐 Soluções para autenticação:');
      console.log('   1. Ative verificação em duas etapas no Google');
      console.log('   2. Gere uma "Senha de App" em:');
      console.log('      https://myaccount.google.com/apppasswords');
      console.log('   3. Use essa nova senha no .env');
    }
    
    if (error.code === 'ECONNECTION') {
      console.log('\n🌐 Problema de conexão - tentando porta 465...');
      // Tentar porta 465 (SSL)
      config.port = 465;
      config.secure = true;
      console.log('   Nova configuração:', config.port, config.secure);
    }
  }
}

// Executar
console.log('🧪 Teste Simples de Email - PROAE UFBA');
console.log('========================================\n');

testSimple(); 