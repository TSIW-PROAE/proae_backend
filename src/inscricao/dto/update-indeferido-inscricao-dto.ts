import { IsArray, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { StatusInscricao } from '../../core/shared-kernel/enums/enumStatusInscricao';

export class UpdateIndeferidoInscricaoDto {
  @IsOptional()
  @IsNumber()
  formulario?: number;

  @IsOptional()
  @IsArray({ each: true })
  documentos?: number[];

  @IsNotEmpty()
  status_inscricao: StatusInscricao;
}
