import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { UnidadeEnum } from '../../enum/enumCampus';

export class AlunoResponseDto {
  @ApiProperty({ type: Number, description: 'ID do aluno' })
  @Expose()
  aluno_id: number;

  @ApiProperty({ type: String, description: 'Nome do aluno' })
  @Expose()
  nome: string;

  @ApiProperty({ type: String, description: 'Email do aluno' })
  @Expose()
  email: string;

  @ApiProperty({ type: String, description: 'Matrícula do aluno' })
  @Expose()
  matricula: string;

  @ApiProperty({ type: Date, description: 'Data de nascimento do aluno' })
  @Expose()
  data_nascimento: Date;

  @ApiProperty({ type: String, description: 'Curso do aluno' })
  @Expose()
  curso: string;

  @ApiProperty({ enum: UnidadeEnum, description: 'Campus do aluno' })
  @Expose()
  campus: UnidadeEnum;

  @ApiProperty({ type: String, description: 'CPF do aluno' })
  @Expose()
  cpf: string;

  @ApiProperty({ type: String, description: 'Data de ingresso do aluno' })
  @Expose()
  data_ingresso: string;

  @ApiProperty({ type: String, description: 'Número de celular do aluno' })
  @Expose()
  celular: string;
}
