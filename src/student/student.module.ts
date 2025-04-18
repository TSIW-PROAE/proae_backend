import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentService } from './student.service';
import { StudentController } from './student.controller';
import { Aluno } from '../entities/aluno/aluno.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Aluno])],
  controllers: [StudentController],
  providers: [StudentService],
})
export class StudentModule {}
