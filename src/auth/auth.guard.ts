import { JwtService } from '@nestjs/jwt';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  private static userId: string;

  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token ausente');
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'seu_secret_jwt_aqui',
      });

      request['user'] = {
        userId: payload.sub,
        email: payload.email,
        aluno_id: payload.aluno_id,
      };
      AuthGuard.setUserId(payload.sub);
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

  public static getUserId(): string {
    return this.userId;
  }

  private static setUserId(id: string): void {
    this.userId = id;
  }
}
