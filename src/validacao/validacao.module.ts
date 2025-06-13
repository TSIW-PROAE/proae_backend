import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Validacao } from '../entities/validacao/validacao.entity';
import { ValidacaoController } from './validacao.controller';
import { ValidacaoService } from './validacao.service';

@Module({
  imports: [TypeOrmModule.forFeature([Validacao])],
  controllers: [ValidacaoController],
  providers: [ValidacaoService],
})
export class ValidacaoModule { }
