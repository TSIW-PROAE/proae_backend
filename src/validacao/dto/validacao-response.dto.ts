import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { StatusDocumento } from '../../enum/statusDocumento';

export class ValidacaoResponseDto {
  @ApiProperty({ type: Number, description: 'ID da validação' })
  @Expose()
  id: number;

  @ApiProperty({ enum: StatusDocumento, description: 'Status da validação' })
  @Expose()
  status: StatusDocumento;

  @ApiProperty({
    type: String,
    required: false,
    description: 'Parecer do validador',
  })
  @Expose()
  parecer?: string;

  @ApiProperty({
    type: Date,
    format: 'date',
    required: false,
    description: 'Data da validação',
  })
  @Expose()
  data_validacao?: Date;
}
