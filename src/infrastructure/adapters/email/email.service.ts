import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as nodemailer from 'nodemailer';
import { Repository } from 'typeorm';
import { AdminNotificacaoEmail } from 'src/infrastructure/persistence/typeorm/entities/admin/admin-notificacao-email.entity';
import { adminAprovadoTemplate } from './templates/admin_aprovado.template';
import { adminApprovalTemplate } from './templates/aprovacao_cadastro.template';
import { confirmacaoCadastroAlunoTemplate } from './templates/confirmacao_cadastro_aluno.template';
import { recuperacaoSenhaTemplate } from './templates/recuperacao_senha.template';
import type { EmailSenderPort } from '../../../core/application/utilities/ports/email-sender.port';

@Injectable()
export class EmailService implements EmailSenderPort {
  private transporter: nodemailer.Transporter;

  constructor(
    @Optional()
    @InjectRepository(AdminNotificacaoEmail)
    private readonly notificacaoRepo?: Repository<AdminNotificacaoEmail>,
  ) {
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

  /** Banco tem prioridade; se vazio, usa ADMINS_EMAILS do ambiente. */
  private async resolveAdminApprovalRecipients(): Promise<string[]> {
    if (this.notificacaoRepo) {
      const rows = await this.notificacaoRepo.find({ order: { id: 'ASC' } });
      if (rows.length > 0) {
        return rows.map((r) => r.email.trim()).filter(Boolean);
      }
    }
    return (
      process.env.ADMINS_EMAILS?.split(',')
        .map((e) => e.trim())
        .filter(Boolean) ?? []
    );
  }

  async sendAdminApprovalRequest(
    emailNovoAdmin: string,
    token: string,
    perfilPretendido?: string | null,
  ): Promise<void> {
    const adminsEmails = await this.resolveAdminApprovalRecipients();
    if (adminsEmails.length === 0) {
      console.error(
        '[sendAdminApprovalRequest] ADMINS_EMAILS não configurado. Email de aprovação NÃO foi enviado. Configure ADMINS_EMAILS no .env (emails separados por vírgula).',
      );
      throw new Error(
        'ADMINS_EMAILS não configurado. Configure no .env os emails dos admins que devem receber pedidos de aprovação.',
      );
    }

    const html = adminApprovalTemplate(emailNovoAdmin, token, perfilPretendido);
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

  async sendAlunoCadastroConfirmation(
    email: string,
    confirmUrl: string,
  ): Promise<void> {
    const html = confirmacaoCadastroAlunoTemplate(confirmUrl);
    const mailOptions: nodemailer.SendMailOptions = {
      from: `"PROAE - UFBA" <${process.env.GMAIL_USER as string}>`,
      to: email,
      subject: 'Confirme seu cadastro de estudante - PROAE UFBA',
      html,
    };
    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('[sendAlunoCadastroConfirmation] Email enviado: %s', info.messageId);
    } catch (error) {
      console.error('Erro ao enviar email de confirmação de aluno:', error);
      throw new Error('Falha ao enviar email de confirmação de cadastro');
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

  private formatPrazo(prazo?: string | Date | null): string | null {
    if (!prazo) return null;
    const d = prazo instanceof Date ? prazo : new Date(prazo);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private buildAlunoProcessTemplate(input: {
    nome?: string | null;
    title: string;
    message: string;
    ctaUrl?: string;
    ctaLabel?: string;
    prazoLimite?: string | Date | null;
  }): string {
    const nome = input.nome?.trim() || 'estudante';
    const prazoFmt = this.formatPrazo(input.prazoLimite);
    const ctaLabel = input.ctaLabel?.trim() || 'Acessar sistema';
    const ctaHtml =
      input.ctaUrl && input.ctaUrl.trim()
        ? `<p style="margin:20px 0 0"><a href="${input.ctaUrl}" style="display:inline-block;background:#183b4e;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:600">${ctaLabel}</a></p>`
        : '';
    const prazoHtml = prazoFmt
      ? `<p style="margin:16px 0 0;color:#8a4b00;background:#fff7e6;border:1px solid #ffd591;padding:10px 12px;border-radius:8px"><strong>Prazo limite:</strong> ${prazoFmt}</p>`
      : '';

    return `
      <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#1f2937">
        <h2 style="margin:0 0 8px;color:#183b4e">PROAE - UFBA</h2>
        <p style="margin:0 0 16px">Olá, ${nome}.</p>
        <h3 style="margin:0 0 10px;color:#111827">${input.title}</h3>
        <p style="margin:0">${input.message}</p>
        ${prazoHtml}
        ${ctaHtml}
        <p style="margin:24px 0 0;color:#6b7280;font-size:13px">Esta é uma mensagem automática para lembrar ações importantes no sistema.</p>
      </div>
    `;
  }

  async sendAlunoProcessNotification(input: {
    email: string;
    nome?: string | null;
    subject: string;
    title: string;
    message: string;
    ctaUrl?: string;
    ctaLabel?: string;
    prazoLimite?: string | Date | null;
  }): Promise<void> {
    const html = this.buildAlunoProcessTemplate(input);
    const mailOptions: nodemailer.SendMailOptions = {
      from: `"PROAE - UFBA" <${process.env.GMAIL_USER as string}>`,
      to: input.email,
      subject: input.subject,
      html,
    };
    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('[sendAlunoProcessNotification] Email enviado: %s', info.messageId);
    } catch (error) {
      console.error('[sendAlunoProcessNotification] Erro ao enviar email:', error);
      throw new Error('Falha ao enviar email transacional ao aluno');
    }
  }
}
