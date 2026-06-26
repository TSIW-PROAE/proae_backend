export interface EmailSenderPort {
  sendPasswordRecovery(email: string, token: string): Promise<void>;
  /**
   * Envia o pedido de aprovação de novo admin aos aprovadores configurados.
   * Quando `perfilPretendido` é informado, o template destaca o perfil que o
   * candidato escolheu e oferece links de aprovação para cada perfil possível
   * (técnico, gerencial e coordenação), permitindo ao aprovador trocar antes
   * de homologar.
   */
  sendAdminApprovalRequest(
    emailNovoAdmin: string,
    token: string,
    perfilPretendido?: string | null,
  ): Promise<void>;
  /** Notifica o novo admin que o cadastro foi aprovado e envia link para login. */
  sendAdminApprovedNotification(email: string, loginUrl: string): Promise<void>;
  /** Link de confirmação enviado ao próprio estudante (cadastro de aluno). */
  sendAlunoCadastroConfirmation(email: string, confirmUrl: string): Promise<void>;
  /** Notificação transacional para eventos de processo/inscrição do aluno. */
  sendAlunoProcessNotification(input: {
    email: string;
    nome?: string | null;
    subject: string;
    title: string;
    message: string;
    ctaUrl?: string;
    ctaLabel?: string;
    prazoLimite?: string | Date | null;
  }): Promise<void>;
}

