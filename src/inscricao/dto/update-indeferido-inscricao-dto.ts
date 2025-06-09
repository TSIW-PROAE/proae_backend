import { IsNotEmpty, IsNumber, IsOptional, IsArray } from 'class-validator';
import { StatusInscricao } from '../../enum/enumStatusInscricao';

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
