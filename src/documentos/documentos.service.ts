import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StatusDocumento } from 'src/core/shared-kernel/enums/statusDocumento';
import { CreateDocumentoDto } from './dto/create-documento.dto';
import { UpdateDocumentoDto } from './dto/update-documento.dto';
import { PendentDocumentoDto } from './dto/pendent-documento.dto';
import {
  FILE_STORAGE,
  type FileStoragePort,
} from '../core/application/utilities';
import {
  CheckResubmissionPermissionUseCase,
  CreateDocumentoUseCase,
  FindDocumentoByIdUseCase,
  FindDocumentoWithOwnerByIdUseCase,
  FindDocumentosByInscricaoUseCase,
  FindInscricaoOwnerUserIdUseCase,
  GetDocumentsWithProblemsByStudentUseCase,
  GetReprovadoDocumentsByStudentUseCase,
  HasReprovadoDocumentsByStudentUseCase,
  RemoveDocumentoUseCase,
  UpdateDocumentoUseCase,
} from '../core/application/documento';

@Injectable()
export class DocumentoService {
  constructor(
    @Inject(FILE_STORAGE)
    private readonly storageService: FileStoragePort,
    private readonly createDocumentoUseCase: CreateDocumentoUseCase,
    private readonly findDocumentosByInscricaoUseCase: FindDocumentosByInscricaoUseCase,
    private readonly findDocumentoByIdUseCase: FindDocumentoByIdUseCase,
    private readonly updateDocumentoUseCase: UpdateDocumentoUseCase,
    private readonly removeDocumentoUseCase: RemoveDocumentoUseCase,
    private readonly getReprovadoDocumentsByStudentUseCase: GetReprovadoDocumentsByStudentUseCase,
    private readonly hasReprovadoDocumentsByStudentUseCase: HasReprovadoDocumentsByStudentUseCase,
    private readonly getDocumentsWithProblemsByStudentUseCase: GetDocumentsWithProblemsByStudentUseCase,
    private readonly checkResubmissionPermissionUseCase: CheckResubmissionPermissionUseCase,
    private readonly findInscricaoOwnerUserIdUseCase: FindInscricaoOwnerUserIdUseCase,
    private readonly findDocumentoWithOwnerByIdUseCase: FindDocumentoWithOwnerByIdUseCase,
  ) {}

  async createDocumento(
    createDocumentoDto: CreateDocumentoDto,
    files: Express.Multer.File[],
  ) {
    try {
      if (!files || files.length === 0) {
        throw new BadRequestException('Nenhum arquivo foi enviado');
      }

      const ownerUserId = await this.findInscricaoOwnerUserIdUseCase.execute(
        createDocumentoDto.inscricao,
      );
      if (!ownerUserId) {
        throw new BadRequestException('Inscrição não encontrada');
      }

      const documentUrl = (
        await this.storageService.uploadDocuments(
          ownerUserId,
          files,
        )
      ).arquivos[0].nome_do_arquivo;

      const novoDocumento = await this.createDocumentoUseCase.execute({
        inscricao_id: createDocumentoDto.inscricao,
        tipo_documento: createDocumentoDto.tipo_documento as any,
        documento_url: documentUrl,
        status_documento: (createDocumentoDto.status_documento as any) ?? undefined,
      });
      return {
        sucess: true,
        documento: novoDocumento,
      };
    } catch (error) {
      const e = error as Error;
      console.error('Erro ao inserir documento', error);
      throw new BadRequestException(`Erro ao inserir documento: ${e.message}`);
    }
  }

  async findAllDocumentoByInscricao(inscricaoId: number) {
    try {
      const documentos = await this.findDocumentosByInscricaoUseCase.execute(inscricaoId);

      if (!documentos.length) {
        throw new NotFoundException(
          'Nenhum documento encontrado para essa inscrição',
        );
      }

      return {
        sucess: true,
        documentos: documentos,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const e = error as Error;
      console.error('Erro buscar documentos', error);
      throw new BadRequestException(
        `Erro ao buscar documentos dessa inscrição: ${e.message}`,
      );
    }
  }

  async findOneDocumento(id: number) {
    try {
      const documento = await this.findDocumentoByIdUseCase.execute(id);

      if (!documento) {
        throw new NotFoundException('Documento não encontrado');
      }
      return {
        sucess: true,
        documentos: documento,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const e = error as Error;
      console.error('Erro buscar documentos', error);
      throw new BadRequestException(
        `Erro ao buscar documento dessa inscrição: ${e.message}`,
      );
    }
  }

  async updateDocumento(id: number, updateDocumentoDto: UpdateDocumentoDto) {
    try {
      const doc_atualizado = await this.updateDocumentoUseCase.execute(
        id,
        updateDocumentoDto as any,
      );
      return {
        sucess: true,
        documento: doc_atualizado,
      };
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === 'Documento não encontrado'
      ) {
        throw new NotFoundException('Documento não encontrado');
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      const e = error as Error;
      console.error('Erro atualizar documento', error);
      throw new BadRequestException(
        `Erro ao atualizar documento: ${e.message}`,
      );
    }
  }

  async removeDocumento(id: number) {
    try {
      await this.removeDocumentoUseCase.execute(id);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === 'Documento não encontrado'
      ) {
        throw new NotFoundException('Documento não encontrado');
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      const e = error as Error;
      console.error('Erro ao remover documento', error);
      throw new BadRequestException(
        `Erro ao remover documento dessa inscrição: ${e.message}`,
      );
    }
  }

  /**
   * Check if a student has any documents with "REPROVADO" status
   */
  async hasReprovadoDocuments(userId: string): Promise<boolean> {
    try {
      return this.hasReprovadoDocumentsByStudentUseCase.execute(userId);
    } catch (error) {
      const e = error as Error;
      console.error('Erro ao verificar documentos reprovados', error);
      throw new BadRequestException(
        `Erro ao verificar status dos documentos: ${e.message}`,
      );
    }
  }

  /**
   * Get all reprovado documents for a student
   */
  async getReprovadoDocumentsByStudent(userId: string) {
    try {
      const reprovadoDocuments =
        await this.getReprovadoDocumentsByStudentUseCase.execute(userId);

      return {
        success: true,
        documentos: reprovadoDocuments,
      };
    } catch (error) {
      const e = error as Error;
      console.error('Erro ao buscar documentos reprovados', error);
      throw new BadRequestException(
        `Erro ao buscar documentos reprovados: ${e.message}`,
      );
    }
  }

  /**
   * Get all pendent documents for a student
   */
  async getDocumentsWithProblemsByStudent(userId: string) {
    try {
      const pendencias = await this.getDocumentsWithProblemsByStudentUseCase.execute(
        userId,
      );

      return {
        success: true,
        pendencias: pendencias,
      };
    } catch (error) {
      const e = error as Error;

      // Relança NotFoundException
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new BadRequestException(
        `Erro ao buscar documentos pendentes: ${e.message}`,
      );
    }
  }

  /**
   * Allow resubmission of a document (reset status to PENDENTE)
   */
  async resubmitDocument(
    userId: string,
    documentoId: number,
    updateData: Partial<UpdateDocumentoDto>,
    file: Express.Multer.File[],
  ) {
    try {
      // First, check if the student has permission to resubmit (has at least one reprovado document)
      const hasPermission = await this.hasReprovadoDocuments(userId);

      if (!hasPermission) {
        throw new ForbiddenException(
          'Você só pode editar documentos se tiver pelo menos um documento reprovado',
        );
      }

      const documentoWithOwner =
        await this.findDocumentoWithOwnerByIdUseCase.execute(documentoId);
      if (!documentoWithOwner) {
        throw new NotFoundException('Documento não encontrado');
      }

      // Verify the document belongs to the requesting student
      if (documentoWithOwner.owner_user_id !== userId) {
        throw new ForbiddenException(
          'Você não tem permissão para editar este documento',
        );
      }

      const documentUrl = (
        await this.storageService.uploadDocuments(
          userId,
          file,
        )
      ).arquivos[0].nome_do_arquivo;

      const documentoAtualizado = await this.updateDocumentoUseCase.execute(documentoId, {
        ...updateData,
        documento_url: documentUrl,
        status_documento: StatusDocumento.PENDENTE,
      });

      return {
        success: true,
        message: 'Documento reenviado com sucesso para nova análise',
        documento: documentoAtualizado,
      };
    } catch (error) {
      const e = error as Error;
      console.error('Erro ao reenviar documento', error);
      if (
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(`Erro ao reenviar documento: ${e.message}`);
    }
  }

  /**
   * Check if a student can edit their documents and data
   */
  async checkResubmissionPermission(userId: string) {
    try {
      const result =
        await this.checkResubmissionPermissionUseCase.execute(userId);

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      const e = error as Error;
      console.error('Erro ao verificar permissão de reenvio', error);
      throw new BadRequestException(
        `Erro ao verificar permissões: ${e.message}`,
      );
    }
  }
}
