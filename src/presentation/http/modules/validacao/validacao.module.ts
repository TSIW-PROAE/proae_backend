import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from 'src/presentation/http/modules/auth/auth.module';
import { Validacao } from 'src/infrastructure/persistence/typeorm/entities/validacao/validacao.entity';
import { Usuario } from 'src/infrastructure/persistence/typeorm/entities/usuarios/usuario.entity';
import { Step } from 'src/infrastructure/persistence/typeorm/entities/step/step.entity';
import { Documento } from 'src/infrastructure/persistence/typeorm/entities/documento/documento.entity';
import { ValidacaoController } from './validacao.controller';
import { ValidacaoService } from './validacao.service';
import { VALIDACAO_REPOSITORY } from 'src/core/application/validacao/validacao.tokens';
import { ValidacaoTypeOrmRepository } from 'src/infrastructure/persistence/typeorm/repositories/validacao.typeorm.repository';
import { AprovarValidacaoUseCase } from 'src/core/application/validacao/use-cases/aprovar-validacao.use-case';
import { CreateValidacaoUseCase } from 'src/core/application/validacao/use-cases/create-validacao.use-case';
import { FindAllValidacoesUseCase } from 'src/core/application/validacao/use-cases/find-all-validacoes.use-case';
import { FindValidacaoByIdUseCase } from 'src/core/application/validacao/use-cases/find-validacao-by-id.use-case';
import { FindValidacoesByStatusUseCase } from 'src/core/application/validacao/use-cases/find-validacoes-by-status.use-case';
import { RemoveValidacaoUseCase } from 'src/core/application/validacao/use-cases/remove-validacao.use-case';
import { ReprovarValidacaoUseCase } from 'src/core/application/validacao/use-cases/reprovar-validacao.use-case';
import { UpdateValidacaoUseCase } from 'src/core/application/validacao/use-cases/update-validacao.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([Validacao, Usuario, Step, Documento]),
    forwardRef(() => AuthModule),
  ],
  controllers: [ValidacaoController],
  providers: [
    { provide: VALIDACAO_REPOSITORY, useClass: ValidacaoTypeOrmRepository },
    CreateValidacaoUseCase,
    FindAllValidacoesUseCase,
    FindValidacaoByIdUseCase,
    UpdateValidacaoUseCase,
    RemoveValidacaoUseCase,
    AprovarValidacaoUseCase,
    ReprovarValidacaoUseCase,
    FindValidacoesByStatusUseCase,
    ValidacaoService,
  ],
  exports: [ValidacaoService],
})
export class ValidacaoModule {}
