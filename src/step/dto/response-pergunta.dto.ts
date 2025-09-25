import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { EnumInputFormat } from 'src/enum/enumInputFormat';
import { EnumTipoInput } from 'src/enum/enumTipoInput';

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
    example: ['Opção 1', 'Opção 2'],
    description: 'Opções para perguntas do tipo select',
  })
  opcoes: string[] = [];
}
