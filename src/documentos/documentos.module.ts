import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inscricao } from 'src/entities/inscricao/inscricao.entity';
import { Documento } from 'src/entities/documento/documento.entity';
import { DocumentoController } from './documentos.controller';
import { DocumentoService } from './documentos.service';

@Module({
  imports: [TypeOrmModule.forFeature([Documento, Inscricao])],
  controllers: [DocumentoController],
  providers: [DocumentoService],
})
export class DocumentoModule {}
