import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Documento } from 'src/entities/documento/documento.entity';
import { Repository } from 'typeorm';
import { UpdateDocumentoDto } from './dto/update-documento.dto';
import { CreateDocumentoDto } from './dto/create-documento.dto';
import { Inscricao } from 'src/entities/inscricao/inscricao.entity';

@Injectable()
export class DocumentoService {
  constructor(
    @InjectRepository(Documento)
    private readonly documentoRepository: Repository<Documento>,
    @InjectRepository(Inscricao)
    private inscricaoRepository: Repository<Inscricao>,
  ) {}

  async createDocumento(createDocumentoDto: CreateDocumentoDto) {
    try {
      const inscricao = await this.inscricaoRepository.findOne({
        where: { inscricao_id: createDocumentoDto.inscricao },
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
        where: { inscricao: { inscricao_id: inscricaoId } },
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
}
