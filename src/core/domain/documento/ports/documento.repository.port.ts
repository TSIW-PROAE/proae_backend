import type {
  DocumentoData,
  DocumentoOwnerData,
  DocumentosComProblemasPorInscricao,
  CreateDocumentoData,
  UpdateDocumentoData,
} from '../documento.types';

/**
 * Porta (interface) do repositório de Documento.
 * A implementação vive na camada de infraestrutura; o domínio só depende desta interface.
 */
export interface IDocumentoRepository {
  create(data: CreateDocumentoData): Promise<DocumentoData>;
  findOneById(id: number): Promise<DocumentoData | null>;
  findOneByIdWithOwner(id: number): Promise<DocumentoOwnerData | null>;
  update(id: number, data: UpdateDocumentoData): Promise<DocumentoData>;
  remove(id: number): Promise<void>;

  findAllByInscricao(inscricaoId: number): Promise<DocumentoData[]>;
  findInscricaoOwnerUserId(inscricaoId: number): Promise<string | null>;
  hasReprovadoDocumentsByStudent(userId: string): Promise<boolean>;
  getReprovadoDocumentsByStudent(userId: string): Promise<DocumentoData[]>;
  getDocumentsWithProblemsByStudent(
    userId: string,
  ): Promise<DocumentosComProblemasPorInscricao[]>;
}