import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { StatusInscricao } from '../../enum/enumStatusInscricao';
import { CreateRespostaDto } from './create-resposta-dto';

export class CreateInscricaoDto {
  @ApiProperty({ type: Number, description: 'ID do aluno' })
  @IsNotEmpty()
  @IsNumber()
  aluno: number;

  @ApiProperty({ type: Number, description: 'ID do edital' })
  @IsNotEmpty()
  @IsNumber()
  edital: number;

  @ApiProperty({
    type: [CreateRespostaDto],
    description: 'Lista de respostas da inscrição',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRespostaDto)
  respostas: CreateRespostaDto[];
}
