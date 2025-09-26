import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { UnidadeEnum } from '../../enum/enumCampus';

export class AlunoResponseDto {
  @ApiProperty({ type: Number, description: 'ID do aluno' })
  @Expose()
  aluno_id: number;

  @ApiProperty({ type: String, description: 'Nome do usuário' })
  @Expose()
  nome: string; // vem do Usuario

  @ApiProperty({ type: String, description: 'Email do usuário' })
  @Expose()
  email: string; // vem do Usuario

  @ApiProperty({ type: String, description: 'Matrícula do aluno' })
  @Expose()
  matricula: string; // vem do Aluno

  @ApiProperty({ type: Date, description: 'Data de nascimento do aluno' })
  @Expose()
  data_nascimento: Date; // pode vir do Aluno ou Usuario, dependendo do seu model

  @ApiProperty({ type: String, description: 'Curso do aluno' })
  @Expose()
  curso: string; // Aluno

  @ApiProperty({ enum: UnidadeEnum, description: 'Campus do aluno' })
  @Expose()
  campus: UnidadeEnum; // Aluno

  @ApiProperty({ type: String, description: 'CPF do usuário' })
  @Expose()
  cpf: string; // Usuario

  @ApiProperty({ type: String, description: 'Data de ingresso do aluno' })
  @Expose()
  data_ingresso: string; // Aluno

  @ApiProperty({ type: String, description: 'Número de celular do usuário' })
  @Expose()
  celular: string; // Usuario
}
