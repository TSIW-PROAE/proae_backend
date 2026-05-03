import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { StatusEdital } from 'src/core/shared-kernel/enums/enumStatusEdital';

export class UpdateFormularioGeralDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  titulo_edital?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiProperty({ required: false, enum: StatusEdital })
  @IsOptional()
  @IsEnum(StatusEdital)
  status_edital?: StatusEdital;
}
