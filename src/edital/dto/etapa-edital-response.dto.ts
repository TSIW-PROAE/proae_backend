import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class EtapaEditalResponseDto {
  @ApiProperty()
  @Expose()
  id: number;

  @ApiProperty()
  @Expose()
  nome: string;

  @ApiProperty()
  @Expose()
  ordem: number;

  @ApiProperty({ type: String, format: 'date' })
  @Expose()
  data_inicio: Date;

  @ApiProperty({ type: String, format: 'date' })
  @Expose()
  data_fim: Date;
}
