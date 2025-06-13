import {
  IsNotEmpty,
  IsNumber,
  IsDate,
  IsEnum,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { StatusInscricao } from '../../enum/enumStatusInscricao';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { UpdateRespostaDto } from './update-resposta-dto';
import { CreateInscricaoDto } from './create-inscricao-dto';

export class UpdateInscricaoDto extends PartialType(CreateInscricaoDto) {
  @ApiProperty({
    description: 'Data da inscrição',
    example: '2024-03-21',
    required: true,
  })
  @IsDate()
  @Type(() => Date)
  data_inscricao: Date;

  @ApiProperty({
    description: 'Status da inscrição',
    enum: StatusInscricao,
    example: StatusInscricao.PENDENTE,
    required: true,
  })
  @IsOptional()
  @IsEnum(StatusInscricao)
  status_inscricao?: StatusInscricao;

  @ApiProperty({
    type: [UpdateRespostaDto],
    description: 'Lista de respostas da inscrição',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateRespostaDto)
  respostas_editadas: UpdateRespostaDto[];

}
