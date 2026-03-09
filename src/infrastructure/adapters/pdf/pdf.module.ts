import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PDF_RENDERER } from '../../../core/application/utilities/utility.tokens';
import { Edital } from 'src/infrastructure/persistence/typeorm/entities/edital/edital.entity';
import { Inscricao } from 'src/infrastructure/persistence/typeorm/entities/inscricao/inscricao.entity';
import { PdfService } from './pdf.service';

@Module({
  imports: [TypeOrmModule.forFeature([Inscricao, Edital])],
  providers: [PdfService, { provide: PDF_RENDERER, useExisting: PdfService }],
  exports: [PdfService, PDF_RENDERER],
})
export class PdfModule {}
