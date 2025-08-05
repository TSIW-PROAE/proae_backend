import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Aluno } from 'src/entities/aluno/aluno.entity';
import { Documento } from 'src/entities/documento/documento.entity';
import { Inscricao } from 'src/entities/inscricao/inscricao.entity';
import { DocumentoController } from './documentos.controller';
import { DocumentoService } from './documentos.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Documento, Inscricao, Aluno]),
    forwardRef(() => AuthModule),
  ],
  controllers: [DocumentoController],
  providers: [DocumentoService],
})
export class DocumentoModule {}
