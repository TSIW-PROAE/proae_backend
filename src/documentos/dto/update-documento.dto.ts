import { IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';
import { EnumTipoDocumento } from '../../enum/enumTipoDocumento';
import { StatusDocumento } from '../../enum/statusDocumento';

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
