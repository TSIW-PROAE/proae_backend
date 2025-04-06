import { Injectable } from '@nestjs/common';
import type { Request } from 'express';

interface User {
  id: string;
  sessionId: string;
}

@Injectable()
export class AppService {
  getHello(request: Request): string {
    const user = request['user'] as User;
    return `Hello World! Your UserId is ${user.id}`;
  }
}
