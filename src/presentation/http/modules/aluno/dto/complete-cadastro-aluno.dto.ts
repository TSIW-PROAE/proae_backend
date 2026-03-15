import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { UnidadeEnum } from 'src/core/shared-kernel/enums/enumCampus';

/**
 * Dados para completar o cadastro de aluno quando o usuário já está logado mas ainda não tem perfil de estudante.
 */
export class CompleteCadastroAlunoDto {
  @ApiProperty({ description: 'Matrícula', example: '202301234' })
  @IsNotEmpty()
  @IsString()
  matricula: string;

  @ApiProperty({ description: 'Curso', example: 'Ciência da Computação' })
  @IsNotEmpty()
  @IsString()
  curso: string;

  @ApiProperty({ description: 'Campus', enum: UnidadeEnum })
  @IsNotEmpty()
  @IsEnum(UnidadeEnum)
  campus: UnidadeEnum;

  @ApiProperty({ description: 'Data de ingresso (ex.: 2023-01-01)', example: '2023-01-01' })
  @IsNotEmpty()
  @IsString()
  data_ingresso: string;
}
