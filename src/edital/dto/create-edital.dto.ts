import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { EditalEnum } from 'src/enum/enumEdital';
import { CreateEtapasDto } from './create-etapas-edital.dto';

export class CreateEditalDto {
  @ApiProperty({ enum: EditalEnum, description: 'Tipo do edital' })
  @IsNotEmpty()
  @IsEnum(EditalEnum)
  tipo_edital: EditalEnum;

  @ApiProperty({ description: 'Descrição do edital' })
  @IsString()
  descricao: string;

  @ApiProperty({ type: [String], description: 'URL dos documentos do edital' })
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  edital_url: string;

  @ApiProperty({ description: 'Título do edital' })
  @IsNotEmpty()
  @IsString()
  titulo_edital: string;

  @ApiProperty({ description: 'Quantidade de bolsas disponíveis' })
  @IsNotEmpty()
  @IsNumber()
  quantidade_bolsas: number;

  @ApiProperty({ type: [CreateEtapasDto], description: 'Etapas do edital' })
  @ValidateNested({ each: true })
  @Type(() => CreateEtapasDto)
  @IsNotEmpty()
  etapas: CreateEtapasDto[];
}
