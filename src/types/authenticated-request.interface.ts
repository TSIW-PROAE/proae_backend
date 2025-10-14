import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    aluno_id: number;
  };
}

export default AuthenticatedRequest;
