import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
  } from '@nestjs/common';
  import { JwtService } from '@nestjs/jwt';
  import { Request } from 'express';
  import * as dotenv from 'dotenv';
  import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../common/decorators/public';
  
  dotenv.config();
  
  @Injectable()
  export class AuthGuardJwt implements CanActivate {
    private static userId: number;

    constructor(
      private jwtService: JwtService,
      private reflector: Reflector,
    ) {}
  
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
      
      if (isPublic) {
        return true;
      }
  
      const request = context.switchToHttp().getRequest();
      const token = this.extractTokenFromHeader(request);
  
      if (!token) {
        throw new UnauthorizedException('Token invalido ou expirado');
      }
  
      try {
        const payload = await this.jwtService.verifyAsync(token, {
          secret: process.env.JWTSECRET,
        });
  
        request['user'] = payload;
      } catch {
        throw new UnauthorizedException();
      }
      return true;
    }
  
    private extractTokenFromHeader(request: Request): string | undefined {
      const [type, token] = request.headers.authorization?.split(' ') ?? [];
      return type === 'Bearer' ? token : undefined;
    }

    public static getUserId(): number {
      return this.userId;
    }
  }