import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Validacao } from '../entities/validacao/validacao.entity';
import { ValidacaoController } from './validacao.controller';
import { ValidacaoService } from './validacao.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Validacao]),
    forwardRef(() => AuthModule),
  ],
  controllers: [ValidacaoController],
  providers: [ValidacaoService],
})
export class ValidacaoModule {}
