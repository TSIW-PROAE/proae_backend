import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Aluno } from '../entities/aluno/aluno.entity';
import { BeneficioService } from './beneficio.service';
import { BeneficioController } from './beneficio.controller';
import { Beneficio } from 'src/entities/beneficio/beneficio.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Aluno, Beneficio])],
  controllers: [BeneficioController],
  providers: [BeneficioService],
})
export class BeneficioModule {}
