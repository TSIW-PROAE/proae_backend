import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PdfService } from './pdf.service';
import { Inscricao } from '../entities/inscricao/inscricao.entity';
import { Edital } from '../entities/edital/edital.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Inscricao, Edital])],
  providers: [PdfService],
  exports: [PdfService],
})
export class PdfModule {}
