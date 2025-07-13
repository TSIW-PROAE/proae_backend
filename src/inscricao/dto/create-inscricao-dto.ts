import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { CreateRespostaDto } from './create-resposta-dto';

export class CreateInscricaoDto {
  @ApiProperty({
    description: 'ID do edital',
    example: 1,
    required: true,
  })
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
