import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    aluno_id: number;
    /** Ex.: ['admin'] | ['aluno'] — vem do JWT */
    roles?: string[];
  };
}

export default AuthenticatedRequest;
