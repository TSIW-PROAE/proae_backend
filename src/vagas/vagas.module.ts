import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vagas } from '../entities/vagas/vagas.entity';
import { Edital } from '../entities/edital/edital.entity';
import { VagasController } from './vagas.controller';
import { VagasService } from './vagas.service';

@Module({
  imports: [TypeOrmModule.forFeature([Vagas, Edital])],
  controllers: [VagasController],
  providers: [VagasService],
  exports: [VagasService],
})
export class VagasModule {}
