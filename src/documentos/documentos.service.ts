import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Documento } from 'src/entities/documento/documento.entity';
import { Repository } from 'typeorm';
import { UpdateDocumentoDto } from './dto/update-documento.dto';
import { CreateDocumentoDto } from './dto/create-documento.dto';
import { Inscricao } from 'src/entities/inscricao/inscricao.entity';
import { StatusDocumento } from 'src/enum/statusDocumento';
import { Aluno } from 'src/entities/aluno/aluno.entity';

@Injectable()
export class DocumentoService {
  constructor(
    @InjectRepository(Documento)
    private readonly documentoRepository: Repository<Documento>,
    @InjectRepository(Inscricao)
    private inscricaoRepository: Repository<Inscricao>,
    @InjectRepository(Aluno)
    private alunoRepository: Repository<Aluno>,
  ) { }

  async createDocumento(createDocumentoDto: CreateDocumentoDto) {
    try {
      const inscricao = await this.inscricaoRepository.findOne({
        where: { id: createDocumentoDto.inscricao },
      });

      if (!inscricao) {
        throw new BadRequestException('Inscrição não encontrada');
      }
      const documento = this.documentoRepository.create({
        ...createDocumentoDto,
        inscricao,
      });
      const novoDocumento = await this.documentoRepository.save(documento);
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
      const documentos = await this.documentoRepository.find({
        where: { inscricao: { id: inscricaoId } },
      });

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
      const e = error as Error;
      console.error('Erro buscar documentos', error);
      throw new BadRequestException(
        `Erro ao buscar documentos dessa inscrição: ${e.message}`,
      );
    }
  }

  async findOneDocumento(id: number) {
    try {
      const documento = await this.documentoRepository.findOne({
        where: { documento_id: id },
      });

      if (!documento) {
        throw new NotFoundException('Documento não encontrado');
      }
      return {
        sucess: true,
        documentos: documento,
      };
    } catch (error) {
      const e = error as Error;
      console.error('Erro buscar documentos', error);
      throw new BadRequestException(
        `Erro ao buscar documento dessa inscrição: ${e.message}`,
      );
    }
  }

  async updateDocumento(id: number, updateDocumentoDto: UpdateDocumentoDto) {
    try {
      const documento = await this.documentoRepository.findOne({
        where: { documento_id: id },
      });
      if (!documento) {
        throw new NotFoundException('Documento não encontrado');
      }
      Object.assign(documento, updateDocumentoDto);
      const doc_atualizado = await this.documentoRepository.save(documento);
      return {
        sucess: true,
        documento: doc_atualizado,
      };
    } catch (error) {
      const e = error as Error;
      console.error('Erro atualizar documento', error);
      throw new BadRequestException(
        `Erro ao atualizar documento: ${e.message}`,
      );
    }
  }

  async removeDocumento(id: number) {
    try {
      const documento = await this.documentoRepository.findOne({
        where: { documento_id: id },
      });
      if (!documento) {
        throw new NotFoundException('Documento não encontrado');
      }
      await this.documentoRepository.remove(documento);
    } catch (error) {
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
  async hasReprovadoDocuments(clerkId: string): Promise<boolean> {
    try {
      const aluno = await this.alunoRepository.findOne({
        where: { id_clerk: clerkId },
        relations: ['inscricoes', 'inscricoes.documentos'],
      });

      if (!aluno) {
        throw new NotFoundException('Aluno não encontrado');
      }

      for (const inscricao of aluno.inscricoes) {
        const hasReprovado = inscricao.documentos.some(
          doc => doc.status_documento === StatusDocumento.REPROVADO
        );
        if (hasReprovado) {
          return true;
        }
      }

      return false;
    } catch (error) {
      const e = error as Error;
      console.error('Erro ao verificar documentos reprovados', error);
      throw new BadRequestException(`Erro ao verificar status dos documentos: ${e.message}`);
    }
  }

  /**
   * Get all reprovado documents for a student
   */
  async getReprovadoDocumentsByStudent(clerkId: string) {
    try {
      const aluno = await this.alunoRepository.findOne({
        where: { id_clerk: clerkId },
        relations: ['inscricoes', 'inscricoes.documentos'],
      });

      if (!aluno) {
        throw new NotFoundException('Aluno não encontrado');
      }

      const reprovadoDocuments: Documento[] = [];
      for (const inscricao of aluno.inscricoes) {
        const documentosReprovados = inscricao.documentos.filter(
          doc => doc.status_documento === StatusDocumento.REPROVADO
        );
        reprovadoDocuments.push(...documentosReprovados);
      }

      return {
        success: true,
        documentos: reprovadoDocuments,
      };
    } catch (error) {
      const e = error as Error;
      console.error('Erro ao buscar documentos reprovados', error);
      throw new BadRequestException(`Erro ao buscar documentos reprovados: ${e.message}`);
    }
  }

  /**
   * Allow resubmission of a document (reset status to PENDENTE)
   */
  async resubmitDocument(clerkId: string, documentoId: number, updateData: Partial<UpdateDocumentoDto>) {
    try {
      // First, check if the student has permission to resubmit (has at least one reprovado document)
      const hasPermission = await this.hasReprovadoDocuments(clerkId);
      
      if (!hasPermission) {
        throw new ForbiddenException(
          'Você só pode editar documentos se tiver pelo menos um documento reprovado'
        );
      }

      const documento = await this.documentoRepository.findOne({
        where: { documento_id: documentoId },
        relations: ['inscricao', 'inscricao.aluno'],
      });

      if (!documento) {
        throw new NotFoundException('Documento não encontrado');
      }

      // Verify the document belongs to the requesting student
      if (documento.inscricao.aluno.id_clerk !== clerkId) {
        throw new ForbiddenException('Você não tem permissão para editar este documento');
      }

      // Update the document and reset status to PENDENTE for reanalysis
      Object.assign(documento, {
        ...updateData,
        status_documento: StatusDocumento.PENDENTE, // Reset to pending for reanalysis
      });

      const documentoAtualizado = await this.documentoRepository.save(documento);

      return {
        success: true,
        message: 'Documento reenviado com sucesso para nova análise',
        documento: documentoAtualizado,
      };
    } catch (error) {
      const e = error as Error;
      console.error('Erro ao reenviar documento', error);
      if (error instanceof ForbiddenException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Erro ao reenviar documento: ${e.message}`);
    }
  }

  /**
   * Check if a student can edit their documents and data
   */
  async checkResubmissionPermission(clerkId: string) {
    try {
      const hasPermission = await this.hasReprovadoDocuments(clerkId);
      const reprovadoDocsData = await this.getReprovadoDocumentsByStudent(clerkId);

      return {
        success: true,
        canResubmit: hasPermission,
        reprovadoDocuments: reprovadoDocsData.documentos,
        message: hasPermission 
          ? 'Você pode editar seus documentos e dados para reenvio'
          : 'Você não possui documentos reprovados. Edição não permitida.',
      };
    } catch (error) {
      const e = error as Error;
      console.error('Erro ao verificar permissão de reenvio', error);
      throw new BadRequestException(`Erro ao verificar permissões: ${e.message}`);
    }
  }
}
