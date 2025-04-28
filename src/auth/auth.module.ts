import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AlunoModule } from '../aluno/aluno.module';

@Module({
  imports: [AlunoModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
