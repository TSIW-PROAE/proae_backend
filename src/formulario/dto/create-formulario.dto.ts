import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { EnumTipoForm } from '@/src/enum/enumTipoForm';
import { CreatePerguntaDto } from '@/src/pergunta/dto/create-pergunta.dto';

export class CreateFormularioDto {
  @ApiProperty({
    description: 'Título do formulário',
    example: 'Formulário de Cadastro Geral',
  })
  @IsString()
  titulo: string;

  @ApiProperty({
    description: 'Tipo de formulário',
    enum: EnumTipoForm,
    example: EnumTipoForm.FORMULARIO_GERAL,
  })
  @IsEnum(EnumTipoForm)
  tipo_formulario: EnumTipoForm;

  @ApiPropertyOptional({
    description: 'Lista de perguntas do formulário',
    type: [CreatePerguntaDto],
  })
  @ValidateNested({ each: true })
  @Type(() => CreatePerguntaDto)
  @IsOptional()
  perguntas?: CreatePerguntaDto[];
}
