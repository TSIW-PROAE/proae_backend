import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Aluno } from '../entities/aluno/aluno.entity';
import { Beneficio } from '../entities/beneficio/beneficio.entity';
import { BeneficioController } from './beneficio.controller';
import { BeneficioService } from './beneficio.service';

@Module({
  imports: [TypeOrmModule.forFeature([Aluno, Beneficio])],
  controllers: [BeneficioController],
  providers: [BeneficioService],
})
export class BeneficioModule {}
