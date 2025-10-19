import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Validacao } from '../entities/validacao/validacao.entity';
import { Usuario } from '../entities/usuarios/usuario.entity';
import { Step } from '../entities/step/step.entity';
import { Documento } from '../entities/documento/documento.entity';
import { ValidacaoController } from './validacao.controller';
import { ValidacaoService } from './validacao.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Validacao, Usuario, Step, Documento]),
    forwardRef(() => AuthModule),
  ],
  controllers: [ValidacaoController],
  providers: [ValidacaoService],
  exports: [ValidacaoService],
})
export class ValidacaoModule {}
