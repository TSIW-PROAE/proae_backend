import { IsEnum, IsOptional } from 'class-validator';
import { EnumTipoDocumento } from 'src/core/shared-kernel/enums/enumTipoDocumento';

export class ResubmitDocumentoDto {
  @IsOptional()
  @IsEnum(EnumTipoDocumento)
  tipo_documento?: EnumTipoDocumento;
}
