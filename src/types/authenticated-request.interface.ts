import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
    email: string;
    aluno_id: number;
  };
}

export default AuthenticatedRequest;
