import { verifyToken } from '@clerk/backend';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {

  private static clerkId: string;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token ausente');
    }

    try {
      const { sub: userId, sid: sessionId } = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });

      request['user'] = {
        id: userId,
        sessionId,
      };
      AuthGuard.setClerkId(userId);
      return true;
    } catch (e) {
      console.log(e);
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  public static getClerkId(): string {
    return this.clerkId;
  }

  private static setClerkId(id: string): void {
    this.clerkId = id;
  }
}
