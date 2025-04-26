import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString } from 'class-validator';
import { EditalEnum } from 'src/enum/enumEdital';
import { StatusEdital } from 'src/enum/enumStatusEdital';

export class UpdateEditalDto {
  @IsOptional()
  @IsEnum(EditalEnum)
  tipo_beneficio?: EditalEnum;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsString()
  edital_url?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  data_inicio?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  data_fim?: Date;

  @IsOptional()
  @IsEnum(StatusEdital)
  status_edital?: StatusEdital;
}
