import type { DocumentoData } from 'src/core/domain/documento/documento.types';

export class PendentDocumentoDto {
  inscricao_id: number;
  titulo_edital: string;
  documentos: DocumentoData[];
}
