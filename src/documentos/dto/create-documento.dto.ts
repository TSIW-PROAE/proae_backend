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

export class CreateDocumentoDto {
  @IsNotEmpty()
  @IsEnum(EnumTipoDocumento)
  tipo_documento: EnumTipoDocumento;

  @IsNotEmpty()
  @IsNumber()
  inscricao: number;

  @IsNotEmpty()
  @IsString()
  @IsUrl()
  documento_url: string;

  @IsOptional()
  @IsEnum(StatusDocumento)
  status_documento?: StatusDocumento;
}
