import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { EnumTipoDocumento } from 'src/core/shared-kernel/enums/enumTipoDocumento';
import { StatusDocumento } from 'src/core/shared-kernel/enums/statusDocumento';

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
