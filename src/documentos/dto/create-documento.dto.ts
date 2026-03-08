import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { EnumTipoDocumento } from '../../core/shared-kernel/enums/enumTipoDocumento';
import { StatusDocumento } from '../../core/shared-kernel/enums/statusDocumento';
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
