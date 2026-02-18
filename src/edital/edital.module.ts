import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';

import { Edital } from '../entities/edital/edital.entity';
import { Inscricao } from '../entities/inscricao/inscricao.entity';
import { Vagas } from '../entities/vagas/vagas.entity';
import { EditalController } from './edital.controller';
import { EditalService } from './edital.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Edital, Inscricao, Vagas]),
    forwardRef(() => AuthModule),
  ],
  controllers: [EditalController],
  providers: [EditalService],
})
export class EditalModule {}
