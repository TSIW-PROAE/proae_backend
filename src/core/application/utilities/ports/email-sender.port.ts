export interface EmailSenderPort {
  sendPasswordRecovery(email: string, token: string): Promise<void>;
  sendAdminApprovalRequest(emailNovoAdmin: string, token: string): Promise<void>;
  /** Notifica o novo admin que o cadastro foi aprovado e envia link para login. */
  sendAdminApprovedNotification(email: string, loginUrl: string): Promise<void>;
  /** Link de confirmação enviado ao próprio estudante (cadastro de aluno). */
  sendAlunoCadastroConfirmation(email: string, confirmUrl: string): Promise<void>;
}

