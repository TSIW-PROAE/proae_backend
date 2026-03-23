import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        JwtStrategy.extractJwtFromCookie,
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'seu_secret_jwt_aqui',
    });
  }

  private static extractJwtFromCookie(req: Request): string | null {
    if (req.cookies && 'token' in req.cookies && req.cookies.token.length > 0) {
      return req.cookies.token;
    }
    return null;
  }

  async validate(payload: any) {
    const user = await this.authService.resolveJwtUserFromUsuarioId(
      String(payload.sub),
    );
    if (!user) {
      throw new UnauthorizedException();
    }
    return {
      userId: user.usuario_id,
      email: user.email,
      roles: user.roles,
      aluno_id: user.aluno?.aluno_id,
    };
  }
}
