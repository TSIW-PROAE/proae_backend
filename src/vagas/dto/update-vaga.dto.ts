import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateVagaDto {
  @ApiProperty({ description: 'Nome do benefício oferecido', required: false })
  @IsOptional()
  @IsString()
  beneficio?: string;

  @ApiProperty({ description: 'Descrição detalhada do benefício', required: false })
  @IsOptional()
  @IsString()
  descricao_beneficio?: string;

  @ApiProperty({ description: 'Número total de vagas disponíveis', required: false })
  @IsOptional()
  @IsNumber()
  numero_vagas?: number;
}
