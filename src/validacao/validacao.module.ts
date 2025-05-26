import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ValidacaoService } from './validacao.service';
import { ValidacaoController } from './validacao.controller';
import { Validacao } from '../entities/validacao/validacao.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Validacao])],
  controllers: [ValidacaoController],
  providers: [ValidacaoService],
})
export class ValidacaoModule { }
