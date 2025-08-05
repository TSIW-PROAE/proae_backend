import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { StatusDocumento } from '../../enum/statusDocumento';

export class CreateValidacaoDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ enum: StatusDocumento, description: 'Status da validação' })
  status: StatusDocumento;

  @IsOptional()
  @IsString()
  @ApiProperty({
    type: String,
    required: false,
    description: 'Parecer do validador',
  })
  parecer?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @ApiProperty({
    type: Date,
    format: 'date',
    required: false,
    description: 'Data da validação',
  })
  data_validacao?: Date;
}
