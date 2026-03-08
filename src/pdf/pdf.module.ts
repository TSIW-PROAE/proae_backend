import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PdfService } from './pdf.service';
import { Inscricao } from '../entities/inscricao/inscricao.entity';
import { Edital } from '../entities/edital/edital.entity';
import { PDF_RENDERER } from '../core/application/utilities';

@Module({
  imports: [TypeOrmModule.forFeature([Inscricao, Edital])],
  providers: [PdfService, { provide: PDF_RENDERER, useExisting: PdfService }],
  exports: [PdfService, PDF_RENDERER],
})
export class PdfModule {}
