import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { EnumInputFormat } from 'src/core/shared-kernel/enums/enumInputFormat';
import { EnumTipoInput } from 'src/core/shared-kernel/enums/enumTipoInput';

export class DadoResponseDto {
  @Expose()
  @ApiProperty({ example: 1, description: 'ID do dado' })
  id: number;

  @Expose()
  @ApiProperty({ example: 'CPF', description: 'Nome do tipo de dado' })
  nome: string;
}

export class PerguntaResponseDto {
  @Expose()
  @ApiProperty({ example: 1, description: 'ID da pergunta' })
  id: number;

  @Expose()
  @ApiProperty({
    example: 'Qual sua renda familiar?',
    description: 'Texto da pergunta',
  })
  pergunta: string;

  @Expose()
  @ApiProperty({
    example: EnumTipoInput.TEXT,
    description: 'Tipo da pergunta',
  })
  tipo_Pergunta: EnumTipoInput;

  @Expose()
  @ApiProperty({ example: true, description: 'Se a pergunta é obrigatória' })
  obrigatoriedade: boolean;

  @Expose()
  @ApiProperty({
    enum: EnumInputFormat,
    example: EnumInputFormat.CPF,
    description: 'Formato de entrada da pergunta',
  })
  tipo_formatacao: EnumInputFormat;

  @Expose()
  @ApiProperty({
    example: 'Digite sua renda familiar mensal',
    description: 'Placeholder da pergunta',
  })
  placeholder: string;

  @Expose()
  @ApiProperty({
    example: ['Opcao 1', 'Opcao 2'],
    description: 'Opções para perguntas do tipo select',
  })
  opcoes: string[] = [];

  @Expose()
  @Type(() => DadoResponseDto)
  @ApiProperty({
    type: DadoResponseDto,
    description: 'Dado associado à pergunta',
    required: false,
  })
  dado?: DadoResponseDto;
}
