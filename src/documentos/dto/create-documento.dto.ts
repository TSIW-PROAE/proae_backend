import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { EnumTipoDocumento } from '../../enum/enumTipoDocumento';
import { StatusDocumento } from '../../enum/statusDocumento';
import { Type } from 'class-transformer';

export class CreateDocumentoDto {
  @IsNotEmpty()
  @IsEnum(EnumTipoDocumento)
  tipo_documento: EnumTipoDocumento;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  inscricao: number;

  @IsOptional()
  @IsEnum(StatusDocumento)
  status_documento?: StatusDocumento;
}
