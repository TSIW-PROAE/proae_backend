import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class StepSimpleResponseDto {
  @Expose()
  @ApiProperty({ example: '550e8400-e29b-41d4-a916-446655440000', description: 'ID do step' })
  id: string;

  @Expose()
  @ApiProperty({ example: 'Documentação', description: 'Texto do step' })
  texto: string;

  @Expose()
  @ApiProperty({ example: '2025-08-18T10:00:00.000Z', description: 'Data de criação' })
  created_at: Date;

  @Expose()
  @ApiProperty({ example: '2025-08-18T10:00:00.000Z', description: 'Data de atualização' })
  updated_at: Date;
}
