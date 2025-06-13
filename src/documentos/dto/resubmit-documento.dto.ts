import { IsOptional, IsEnum, IsString, IsUrl } from 'class-validator';
import { EnumTipoDocumento } from '../../enum/enumTipoDocumento';

export class ResubmitDocumentoDto {
  @IsOptional()
  @IsEnum(EnumTipoDocumento)
  tipo_documento?: EnumTipoDocumento;

  @IsOptional()
  @IsString()
  @IsUrl()
  documento_url?: string;
} 