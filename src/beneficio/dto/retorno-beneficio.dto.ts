import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty } from 'class-validator';
import { EditalEnum } from 'src/enum/enumEdital';
import { StatusBeneficio } from 'src/enum/enumStatusBeneficio';

export class ReturnBeneficioDto {
  @ApiProperty()
  @IsNotEmpty()
  titulo_beneficio: string; // Temporariamente mudado de EditalEnum para string

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  data_inicio: Date;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(StatusBeneficio)
  beneficio: StatusBeneficio;
}
