import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EditalController } from './edital.controller';
import { EditalService } from './edital.service';
import { Edital } from '../entities/edital/edital.entity';
import { EtapaEdital } from 'src/entities/etapaEdital/etapaEdital.entity';
import { ResultadoEtapa } from 'src/entities/resultadoEtapa/resultadoEtapa.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Edital, EtapaEdital, ResultadoEtapa])],
  controllers: [EditalController],
  providers: [EditalService],
})
export class EditalModule {}
