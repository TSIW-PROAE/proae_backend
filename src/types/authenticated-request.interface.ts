import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    sessionId: string;
  };
}

export default AuthenticatedRequest;
