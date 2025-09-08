import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Pergunta } from '@/src/entities/pergunta/pergunta.entity';
import { FormularioController } from './formulario.controller';
import { FormularioService } from './formulario.service';
import { Formulario } from '../entities/formulario/formulario.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Formulario, Pergunta]),
    forwardRef(() => AuthModule),
  ],
  controllers: [FormularioController],
  providers: [FormularioService],
  exports: [FormularioService],
})
export class FormularioModule {}
