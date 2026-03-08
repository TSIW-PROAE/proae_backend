import { IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';
import { EnumTipoDocumento } from '../../core/shared-kernel/enums/enumTipoDocumento';
import { StatusDocumento } from '../../core/shared-kernel/enums/statusDocumento';

export class UpdateDocumentoDto {
  @IsOptional()
  @IsEnum(EnumTipoDocumento)
  tipo_documento?: EnumTipoDocumento;

  @IsOptional()
  @IsString()
  @IsUrl()
  documento_url?: string;

  @IsOptional()
  @IsEnum(StatusDocumento)
  status_documento?: StatusDocumento;
}
