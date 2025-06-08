import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Aluno } from '../entities/aluno/aluno.entity';
import { BeneficioService } from './beneficio.service';
import { BeneficioController } from './beneficio.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Aluno])],
  controllers: [BeneficioController],
  providers: [BeneficioService],
})
export class BeneficioModule {}
