import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { EnumTipoDocumento } from '../../enum/enumTipoDocumento';
import { StatusDocumento } from '../../enum/statusDocumento';

export class CreateDocumentoDto {
  @IsNotEmpty()
  @IsEnum(EnumTipoDocumento)
  tipo_documento: EnumTipoDocumento;

  @IsNotEmpty()
  @IsString()
  inscricao: string;

  @IsOptional()
  @IsEnum(StatusDocumento)
  status_documento?: StatusDocumento;
}
