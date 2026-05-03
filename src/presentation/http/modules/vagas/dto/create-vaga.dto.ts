import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateVagaDto {
  @ApiProperty({ description: 'ID do edital ao qual a vaga pertence' })
  @IsNotEmpty()
  @IsNumber()
  edital_id: number;

  @ApiProperty({ description: 'Nome do benefício oferecido' })
  @IsNotEmpty()
  @IsString()
  beneficio: string;

  @ApiProperty({ description: 'Descrição detalhada do benefício' })
  @IsNotEmpty()
  @IsString()
  descricao_beneficio: string;

  @ApiProperty({ description: 'Número total de vagas disponíveis' })
  @IsNotEmpty()
  @IsNumber()
  numero_vagas: number;
}
