import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlunoModule } from './aluno/aluno.module';
import { AuthModule } from './auth/auth.module';
import { BeneficioModule } from './beneficio/beneficio.module';
import { typeOrmConfig } from './db/db.config';
import { DocumentoModule } from './documentos/documentos.module';
import { EditalModule } from './edital/edital.module';
import { InscricaoModule } from './inscricao/inscricao.module';
import { MinioClientModule } from './minio/minio-client.module';
import { PerguntaModule } from './pergunta/pergunta.module';
import { StepModule } from './step/step.module';
import { VagasModule } from './vagas/vagas.module';
import { ValidacaoModule } from './validacao/validacao.module';
import { DadoModule } from './tipoDado/tipoDado.module';
import { ValorDadoModule } from './valorDado/valorDado.module';
import { FormularioModule } from './formulario/formulario.module';

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
    BeneficioModule,
    StepModule,
    PerguntaModule,
    VagasModule,
    DadoModule,
    ValorDadoModule,
    FormularioModule,
  ],
})
export class AppModule {}
