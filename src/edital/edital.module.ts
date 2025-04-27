import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EditalController } from './edital.controller';
import { EditalService } from './edital.service';
import { Edital } from '../entities/edital/edital.entity';
import { EtapaInscricao } from 'src/entities/etapaInscricao/etapaInscricao.entity';
import { ResultadoEtapa } from 'src/entities/resultadoEtapa/resultadoEtapa.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Edital, EtapaInscricao, ResultadoEtapa])],
  controllers: [EditalController],
  providers: [EditalService],
})
export class EditalModule {}
