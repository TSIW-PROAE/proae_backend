import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EDITAL_REPOSITORY } from 'src/core/application/edital/edital.tokens';
import { CreateEditalUseCase } from 'src/core/application/edital/use-cases/create-edital.use-case';
import { FindEditalByIdUseCase } from 'src/core/application/edital/use-cases/find-edital-by-id.use-case';
import { GetAlunosInscritosUseCase } from 'src/core/application/edital/use-cases/get-alunos-inscritos.use-case';
import { ListEditaisAbertosUseCase } from 'src/core/application/edital/use-cases/list-editais-abertos.use-case';
import { ListEditaisUseCase } from 'src/core/application/edital/use-cases/list-editais.use-case';
import { RemoveEditalUseCase } from 'src/core/application/edital/use-cases/remove-edital.use-case';
import { UpdateEditalStatusUseCase } from 'src/core/application/edital/use-cases/update-edital-status.use-case';
import { UpdateEditalUseCase } from 'src/core/application/edital/use-cases/update-edital.use-case';
import { Edital } from 'src/infrastructure/persistence/typeorm/entities/edital/edital.entity';
import { EditalTypeOrmRepository } from 'src/infrastructure/persistence/typeorm/repositories/edital.typeorm.repository';
import { AuthModule } from 'src/presentation/http/modules/auth/auth.module';
import { EditalController } from './edital.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Edital]), forwardRef(() => AuthModule)],
  controllers: [EditalController],
  providers: [
    { provide: EDITAL_REPOSITORY, useClass: EditalTypeOrmRepository },
    CreateEditalUseCase,
    ListEditaisUseCase,
    FindEditalByIdUseCase,
    UpdateEditalUseCase,
    RemoveEditalUseCase,
    ListEditaisAbertosUseCase,
    UpdateEditalStatusUseCase,
    GetAlunosInscritosUseCase,
  ],
})
export class EditalModule {}
