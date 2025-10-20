import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { StatusValidacao } from '../../enum/statusValidacao';

export class UsuarioResponseDto {
  @ApiProperty({ type: Number, description: 'ID do usuário' })
  @Expose()
  usuario_id: number;

  @ApiProperty({ type: String, description: 'Nome do usuário' })
  @Expose()
  nome: string;

  @ApiProperty({ type: String, description: 'Email do usuário' })
  @Expose()
  email: string;
}

export class StepResponseDto {
  @ApiProperty({ type: Number, description: 'ID do step' })
  @Expose()
  id: number;

  @ApiProperty({ type: String, description: 'Texto do step' })
  @Expose()
  texto: string;
}

export class ValidacaoResponseDto {
  @ApiProperty({ type: Number, description: 'ID da validação' })
  @Expose()
  id: number;

  @ApiProperty({
    type: String,
    description: 'Parecer da validação',
  })
  @Expose()
  parecer: string;

  @ApiProperty({
    enum: StatusValidacao,
    description: 'Status da validação',
  })
  @Expose()
  status: StatusValidacao;

  @ApiPropertyOptional({
    type: Date,
    format: 'date',
    description: 'Data da validação',
  })
  @Expose()
  data_validacao?: Date;

  @ApiProperty({
    type: UsuarioResponseDto,
    description: 'Responsável pela validação',
  })
  @Expose()
  @Type(() => UsuarioResponseDto)
  responsavel: UsuarioResponseDto;

  @ApiPropertyOptional({
    type: StepResponseDto,
    description: 'Questionário (Step) do edital',
  })
  @Expose()
  @Type(() => StepResponseDto)
  questionario?: StepResponseDto;

  @ApiProperty({ type: Date, description: 'Data de criação' })
  @Expose()
  created_at: Date;

  @ApiProperty({ type: Date, description: 'Data de atualização' })
  @Expose()
  updated_at: Date;
}
