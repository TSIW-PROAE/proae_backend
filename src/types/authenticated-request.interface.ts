import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    sessionId: string;
  };
}

export default AuthenticatedRequest;
