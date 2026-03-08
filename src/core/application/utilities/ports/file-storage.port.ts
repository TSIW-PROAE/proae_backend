export interface UploadDocumentsResult {
  mensagem: string;
  arquivos: Array<{
    nome_do_arquivo: string;
    tipo: string;
  }>;
}

export interface FileStoragePort {
  uploadDocuments(
    userId: string | number,
    files: Express.Multer.File[],
  ): Promise<UploadDocumentsResult>;
  getDocument(userId: string | number, filename: string): Promise<{
    nome_do_arquivo: string;
    url: string;
  }>;
}

