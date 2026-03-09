import { Module } from '@nestjs/common';
import { AlunoModule } from './modules/aluno/aluno.module';
import { AuthModule } from './modules/auth/auth.module';
import { DadoModule } from './modules/tipoDado/tipoDado.module';
import { DocumentoModule } from './modules/documentos/documentos.module';
import { EditalModule } from './modules/edital/edital.module';
import { HealthModule } from './modules/health/health.module';
import { InscricaoModule } from './modules/inscricao/inscricao.module';
import { MinioHttpModule } from './modules/minio/minio.module';
import { PerguntaModule } from './modules/pergunta/pergunta.module';
import { RespostaModule } from './modules/resposta/resposta.module';
import { StepModule } from './modules/step/step.module';
import { VagasModule } from './modules/vagas/vagas.module';
import { ValidacaoModule } from './modules/validacao/validacao.module';
import { ValorDadoModule } from './modules/valorDado/valorDado.module';

@Module({
  imports: [
    HealthModule,
    AuthModule,
    AlunoModule,
    EditalModule,
    InscricaoModule,
    DocumentoModule,
    ValidacaoModule,
    StepModule,
    PerguntaModule,
    RespostaModule,
    VagasModule,
    DadoModule,
    ValorDadoModule,
    MinioHttpModule,
  ],
})
export class HttpModule {}
