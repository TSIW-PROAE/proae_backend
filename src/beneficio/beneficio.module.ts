import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Aluno } from '../entities/aluno/aluno.entity';
import { Beneficio } from '../entities/beneficio/beneficio.entity';
import { BeneficioController } from './beneficio.controller';
import { BeneficioService } from './beneficio.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Aluno, Beneficio]),
    forwardRef(() => AuthModule),
  ],
  controllers: [BeneficioController],
  providers: [BeneficioService],
})
export class BeneficioModule {}
