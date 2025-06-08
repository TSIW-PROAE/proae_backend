import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { AlunoModule } from './aluno/aluno.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './db/db.config';
import { EditalModule } from './edital/edital.module';
import { MinioClientModule } from './minio/minio-client.module';
import { InscricaoModule } from './inscricao/inscricao.module';
import { DocumentoModule } from './documentos/documentos.module';
import { ValidacaoModule } from './validacao/validacao.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(typeOrmConfig),
    AuthModule,
    MinioClientModule,
    AlunoModule,
    EditalModule,
    InscricaoModule,
    DocumentoModule,
    ValidacaoModule,
  ],
})
export class AppModule {}
