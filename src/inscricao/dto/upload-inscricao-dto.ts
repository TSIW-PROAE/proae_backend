export class UpdateInscricaoDto {
    alunoId?: number;
    editalId?: number;
    dataInscricao?: Date;
    statusInscricao?: string;
    formularioId?: number;
    documentos?: number[]; // Similar ao DTO de criação
  }
  