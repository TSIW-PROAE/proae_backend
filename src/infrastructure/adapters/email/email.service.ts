import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { adminAprovadoTemplate } from './templates/admin_aprovado.template';
import { adminApprovalTemplate } from './templates/aprovacao_cadastro.template';
import { recuperacaoSenhaTemplate } from './templates/recuperacao_senha.template';
import type { EmailSenderPort } from '../../../core/application/utilities/ports/email-sender.port';

@Injectable()
export class EmailService implements EmailSenderPort {
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
    const adminsEmails = process.env.ADMINS_EMAILS?.split(',').map((e) => e.trim()).filter(Boolean) ?? [];
    if (adminsEmails.length === 0) {
      console.error(
        '[sendAdminApprovalRequest] ADMINS_EMAILS não configurado. Email de aprovação NÃO foi enviado. Configure ADMINS_EMAILS no .env (emails separados por vírgula).',
      );
      throw new Error(
        'ADMINS_EMAILS não configurado. Configure no .env os emails dos admins que devem receber pedidos de aprovação.',
      );
    }

    const html = adminApprovalTemplate(emailNovoAdmin, token);
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    if (process.env.NODE_ENV !== 'production') {
      console.log(
        '[sendAdminApprovalRequest] Link de aprovação (BACKEND_URL):',
        `${backendUrl}/auth/approve-admin/${token.substring(0, 20)}...`,
      );
    }

    const mailOptions: nodemailer.SendMailOptions = {
      from: `"PROAE - UFBA" <${process.env.GMAIL_USER as string}>`,
      to: adminsEmails,
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

  async sendAdminApprovedNotification(
    email: string,
    loginUrl: string,
  ): Promise<void> {
    const html = adminAprovadoTemplate(loginUrl);
    const mailOptions: nodemailer.SendMailOptions = {
      from: `"PROAE - UFBA" <${process.env.GMAIL_USER as string}>`,
      to: email,
      subject: 'Cadastro aprovado - Acesse o sistema PROAE',
      html,
    };
    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('[sendAdminApprovedNotification] Email enviado ao novo admin: %s', info.messageId);
    } catch (error) {
      console.error('Erro ao enviar email de cadastro aprovado:', error);
      throw new Error('Falha ao enviar notificação de aprovação ao admin');
    }
  }
}
