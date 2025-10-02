import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';
import { StatusValidacao } from '../../enum/statusValidacao';

export class CreateValidacaoDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Parecer da validação',
    example: 'Documento aprovado após análise criteriosa'
  })
  parecer: string;

  @IsOptional()
  @IsEnum(StatusValidacao)
  @ApiPropertyOptional({
    enum: StatusValidacao,
    description: 'Status da validação',
    example: StatusValidacao.PENDENTE,
    default: StatusValidacao.PENDENTE
  })
  status?: StatusValidacao;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @ApiPropertyOptional({
    type: Date,
    format: 'date',
    description: 'Data da validação',
    example: '2024-03-21'
  })
  data_validacao?: Date;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    description: 'ID do responsável pela validação',
    example: 1
  })
  responsavel_id: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({
    description: 'ID do questionário (Step) do edital',
    example: 1
  })
  questionario_id?: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({
    description: 'ID do documento (mantido para compatibilidade)',
    example: 1
  })
  documento_id?: number;
}
