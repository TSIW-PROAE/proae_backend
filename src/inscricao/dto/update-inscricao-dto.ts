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
import { ApiProperty } from '@nestjs/swagger';
import { UpdateRespostaDto } from './update-resposta-dto';

export class UpdateInscricaoDto {
  @IsNotEmpty()
  @IsNumber()
  aluno: number;

  @IsNotEmpty()
  @IsNumber()
  edital: number;

  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  data_inscricao: Date;

  @ApiProperty({ enum: StatusInscricao, description: 'Status da inscrição' })
  @IsNotEmpty()
  @IsEnum(StatusInscricao)
  status_inscricao?: StatusInscricao;

  /*
  @ApiProperty({
    type: [UpdateRespostaDto],
    description: 'Lista de respostas da inscrição',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateRespostaDto)
  respostas?: UpdateRespostaDto[];
  */
}
