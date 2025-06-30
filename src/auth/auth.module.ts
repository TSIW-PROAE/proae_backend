import { Module } from '@nestjs/common';
import { AlunoModule } from '../aluno/aluno.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [AlunoModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
