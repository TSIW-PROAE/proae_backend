import { Documento } from "@/src/entities/documento/documento.entity";
import { StatusDocumento } from "@/src/enum/statusDocumento";

export class PendentDocumentoDto {
    inscricao_id: number;
    titulo_edital: string;
    documentos: Documento[];
}