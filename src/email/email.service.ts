import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { recuperacaoSenhaTemplate } from './templates/recuperacao_senha.template';
import { adminApprovalTemplate } from './templates/aprovacao_cadastro.template';

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
      const info: nodemailer.SentMessageInfo =
        await this.transporter.sendMail(mailOptions);
      console.log('Email de recuperação enviado: %s', info.messageId);
    } catch (error) {
      console.error('Erro ao enviar email de recuperação:', error);
      throw new Error('Falha ao enviar email de recuperação de senha');
    }
  }

  async sendAdminApprovalRequest(
    emailNovoAdmin: string,
    token: string,
  ): Promise<void> {
    const html = adminApprovalTemplate(emailNovoAdmin, token);

    const mailOptions: nodemailer.SendMailOptions = {
      from: `"PROAE - UFBA" <${process.env.GMAIL_USER as string}>`,
      to: process.env.ADMINS_EMAILS?.split(',') || [],
      subject: 'Novo Pedido de Cadastro de Admin - PROAE UFBA',
      html,
    };

    try {
      const info: nodemailer.SentMessageInfo =
        await this.transporter.sendMail(mailOptions);
      console.log('Email de aprovação de admin enviado: %s', info.messageId);
    } catch (error) {
      console.error('Erro ao enviar email de aprovação de admin:', error);
      throw new Error('Falha ao enviar email de aprovação de admin');
    }
  }
}
