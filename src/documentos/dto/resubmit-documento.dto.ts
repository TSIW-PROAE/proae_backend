import { IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';
import { EnumTipoDocumento } from '../../core/shared-kernel/enums/enumTipoDocumento';

export class ResubmitDocumentoDto {
  @IsOptional()
  @IsEnum(EnumTipoDocumento)
  tipo_documento?: EnumTipoDocumento;
}
