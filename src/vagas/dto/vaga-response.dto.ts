import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class VagaResponseDto {
  @Expose()
  @ApiProperty({ example: 1, description: 'ID da vaga' })
  id: number;

  @Expose()
  @ApiProperty({ example: 'Auxílio Alimentação', description: 'Nome do benefício' })
  beneficio: string;

  @Expose()
  @ApiProperty({ example: 'Auxílio para despesas com alimentação', description: 'Descrição do benefício' })
  descricao_beneficio: string;

  @Expose()
  @ApiProperty({ example: 50, description: 'Número de vagas disponíveis' })
  numero_vagas: number;

  @Expose()
  @ApiProperty({ example: '2025-08-18T10:00:00.000Z', description: 'Data de criação' })
  created_at: Date;

  @Expose()
  @ApiProperty({ example: '2025-08-18T10:00:00.000Z', description: 'Data de atualização' })
  updated_at: Date;
}
