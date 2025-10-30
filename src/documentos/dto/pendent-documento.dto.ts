import { Documento } from "@/src/entities/documento/documento.entity";
export class PendentDocumentoDto {
    inscricao_id: number;
    titulo_edital: string;
    documentos: Documento[];
}