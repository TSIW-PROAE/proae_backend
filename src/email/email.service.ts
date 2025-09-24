import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { recuperacaoSenhaTemplate } from './templates/recuperacao_senha.template';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER as string,
        pass: process.env.GMAIL_PASS as string,
      },
    });
  }

  async sendPasswordRecovery(email: string, token: string): Promise<void> {
    const html: string = recuperacaoSenhaTemplate(token);

    const mailOptions: nodemailer.SendMailOptions = {
      from: `"PROAE - UFBA" <${process.env.GMAIL_USER as string}>`,
      to: email,
      subject: 'Recuperação de Senha - PROAE UFBA',
      html,
    };

    try {
      const info: nodemailer.SentMessageInfo = await this.transporter.sendMail(mailOptions);
      console.log('Email de recuperação enviado: %s', info.messageId);
    } catch (error) {
      console.error('Erro ao enviar email de recuperação:', error);
      throw new Error('Falha ao enviar email de recuperação de senha');
    }
  }
}
