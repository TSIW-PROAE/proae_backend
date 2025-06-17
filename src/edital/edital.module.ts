import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EtapaEdital } from 'src/entities/etapaEdital/etapaEdital.entity';
import { Edital } from '../entities/edital/edital.entity';
import { EditalController } from './edital.controller';
import { EditalService } from './edital.service';

@Module({
  imports: [TypeOrmModule.forFeature([Edital, EtapaEdital])],
  controllers: [EditalController],
  providers: [EditalService],
})
export class EditalModule {}
