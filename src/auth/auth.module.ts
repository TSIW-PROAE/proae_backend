import { Module } from '@nestjs/common';
import { AlunoModule } from '../aluno/aluno.module';
import { AuthController } from './auth.controller';
import { SIGNUP_SERVICE, UPDATE_PASSWORD_SERVICE } from './auth.tokens';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuardJwt } from './auth.guard.jwt';
import { JwtModule } from '@nestjs/jwt';
import { AuthServiceJwt } from './implementations/auth.service.jwt';

@Module({
  imports: [
    AlunoModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET_KEY || 'secret',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthServiceJwt, {
      provide: APP_GUARD,
      useClass: AuthGuardJwt,
    },
    {
      provide: SIGNUP_SERVICE,
      useExisting: AuthServiceJwt,
    },
    {
      provide: UPDATE_PASSWORD_SERVICE,
      useExisting: AuthServiceJwt,
    },
  ],
})
export class AuthModule {}
