export interface EmailSenderPort {
  sendPasswordRecovery(email: string, token: string): Promise<void>;
  sendAdminApprovalRequest(emailNovoAdmin: string, token: string): Promise<void>;
}

