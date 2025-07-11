import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty } from 'class-validator';
import { StatusBeneficio } from 'src/enum/enumStatusBeneficio';

export class CreateBeneficioDto {
  @ApiProperty()
  @IsNotEmpty()
  inscricaoId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  data_inicio: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(StatusBeneficio)
  status_beneficio: StatusBeneficio;
}
