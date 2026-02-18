import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { StatusInscricao } from '../../enum/enumStatusInscricao';

export class UpdateIndeferidoInscricaoDto {
  @IsOptional()
  @IsString()
  formulario?: string;

  @IsOptional()
  @IsArray({ each: true })
  documentos?: string[];

  @IsNotEmpty()
  status_inscricao: StatusInscricao;
}
