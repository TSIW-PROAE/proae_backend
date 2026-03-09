import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EMAIL_SENDER } from 'src/core/application/utilities/utility.tokens';
import { Admin } from 'src/infrastructure/persistence/typeorm/entities/admin/admin.entity';
import { Aluno } from 'src/infrastructure/persistence/typeorm/entities/aluno/aluno.entity';
import { Usuario } from 'src/infrastructure/persistence/typeorm/entities/usuarios/usuario.entity';
import { EmailService } from 'src/infrastructure/adapters/email/email.service';
import { AlunoModule } from 'src/presentation/http/modules/aluno/aluno.module';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';

@Module({
  imports: [
    forwardRef(() => AlunoModule),
    PassportModule,
    TypeOrmModule.forFeature([Aluno, Admin, Usuario]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'seu_secret_jwt_aqui',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    { provide: EMAIL_SENDER, useClass: EmailService },
    AuthService,
    LocalStrategy,
    JwtStrategy,
    AuthGuard,
    RolesGuard,
    JwtAuthGuard,
    LocalAuthGuard,
  ],
  exports: [AuthGuard, RolesGuard, JwtModule, AuthService, JwtAuthGuard],
})
export class AuthModule {}
