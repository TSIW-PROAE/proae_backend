import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlunoModule } from '../aluno/aluno.module';
import { Aluno } from '../entities/aluno/aluno.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
// import { GoogleStrategy } from './strategies/google.strategy';

@Module({
  imports: [
    forwardRef(() => AlunoModule),
    PassportModule,
    TypeOrmModule.forFeature([Aluno]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    // GoogleStrategy,
    AuthGuard,
  ],
  exports: [AuthGuard, JwtModule, AuthService],
})
export class AuthModule {}
