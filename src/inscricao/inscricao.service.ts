import { Inscricao } from 'src/entities/inscricao/inscricao.entity';
import { CreateInscricaoDto } from './dto/create-inscricao-dto';
import { In, Repository } from 'typeorm';
import { Aluno } from 'src/entities/aluno/aluno.entity';
import { Edital } from 'src/entities/edital/edital.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Documento } from 'src/entities/documento/documento.entity';
import { StatusDocumento } from 'src/enum/statusDocumento';

export class InscricaoService {
  constructor(
    @InjectRepository(Inscricao)
    private readonly inscricaoRepository: Repository<Inscricao>,
    @InjectRepository(Aluno)
    private readonly alunoRepository: Repository<Aluno>,
    @InjectRepository(Edital)
    private readonly editalRepository: Repository<Edital>,
    @InjectRepository(Documento)
    private readonly documentoRepository: Repository<Documento>,
  ) {}
  async createInscricao(createInscricaoDto: CreateInscricaoDto) {
    try {
      const { aluno, edital, data_inscricao, documentos } = createInscricaoDto;

      const alunoExiste = await this.alunoRepository.findOne({
        where: { aluno_id: aluno },
      });
      const editalExiste = await this.editalRepository.findOne({
        where: { id: edital },
      });

      if (!alunoExiste) {
        throw new NotFoundException('Aluno ou Edital não encontrado');
      }

      if (!editalExiste) {
        throw new NotFoundException('Aluno ou Edital não encontrado');
      }

      const inscricao = new Inscricao();
      inscricao.aluno = alunoExiste;
      inscricao.edital = editalExiste;
      inscricao.data_inscricao = data_inscricao;

      if (documentos && documentos.length > 0) {
        const documentos_finais = await this.documentoRepository.find({
          where: { documento_id: In(documentos) },
        });
        if (documentos_finais.length > 0) {
          inscricao.documentos = documentos_finais;
        } else {
          throw new NotFoundException(
            'Alguns documentos não foram encontrados',
          );
        }
      }

      const inscricaoFinal = await this.inscricaoRepository.save(inscricao);
      return {
        sucess: true,
        inscricao: inscricaoFinal,
      };
    } catch (error) {
      const e = error as Error;
      console.error('Falha ao submeter uma inscrição', error);
      throw new BadRequestException(
        `Falha ao submeter uma inscrição: ${e.message}`,
      );
    }
  }
  async updateInscricao(
    inscricaoId: number,
    updateInscricaoDto: CreateInscricaoDto,
  ) {
    try {
      const { aluno, edital, data_inscricao, status_inscricao, documentos } =
        updateInscricaoDto;

      const inscricaoExistente = await this.inscricaoRepository.findOne({
        where: { inscricao_id: inscricaoId },
        relations: ['aluno', 'edital', 'documentos'],
      });

      if (!inscricaoExistente) {
        throw new NotFoundException('Inscrição não encontrada');
      }

      const alunoExiste = await this.alunoRepository.findOne({
        where: { aluno_id: aluno },
      });
      const editalExiste = await this.editalRepository.findOne({
        where: { id: edital },
      });

      if (!alunoExiste) {
        throw new NotFoundException('Aluno não encontrado');
      }

      if (!editalExiste) {
        throw new NotFoundException('Edital não encontrado');
      }

      inscricaoExistente.aluno = alunoExiste;
      inscricaoExistente.edital = editalExiste;
      inscricaoExistente.data_inscricao = data_inscricao;

      if (status_inscricao !== undefined) {
        inscricaoExistente.status_inscricao = status_inscricao;
      }

      if (documentos && documentos.length > 0) {
        const documentosFinais = await this.documentoRepository.find({
          where: { documento_id: In(documentos) },
        });
        if (documentosFinais.length > 0) {
          inscricaoExistente.documentos = documentosFinais;
        } else {
          throw new NotFoundException(
            'Alguns documentos não foram encontrados',
          );
        }
      }

      const inscricaoAtualizada =
        await this.inscricaoRepository.save(inscricaoExistente);

      return {
        success: true,
        inscricao: inscricaoAtualizada,
      };
    } catch (error) {
      const e = error as Error;
      console.error('Falha ao editar a inscrição', error);
      throw new BadRequestException(
        `Falha ao editar a inscrição: ${e.message}`,
      );
    }
  }

  async getInscricoesByAluno(idClerk: string) {
    try {
      const aluno = await this.alunoRepository.findOne({
        where: { id_clerk: idClerk },
      });

      if (!aluno) {
        throw new NotFoundException('Aluno não encontrado');
      }

      const inscricoes = await this.inscricaoRepository.find({
        where: { 
          aluno: { aluno_id: aluno.aluno_id },
          documentos: {
            status_documento: StatusDocumento.PENDENTE
          }
        },
        relations: ['edital', 'documentos'],
      });

      return inscricoes.map(inscricao => ({
        titulo_edital: inscricao.edital.titulo_edital,
        tipo_edital: [inscricao.edital.tipo_edital],
        documentos: inscricao.documentos.filter(documento => 
          documento.status_documento === StatusDocumento.PENDENTE
        ).map(documento => ({
          tipo_documento: documento.tipo_documento,
          status_documento: documento.status_documento,
          documento_url: documento.documento_url,
        })),
      })).filter(inscricao => inscricao.documentos.length > 0);
    } catch (error) {
      const e = error as Error;
      console.error('Falha ao buscar inscrições com pendências do aluno', error);
      throw new BadRequestException(
        `Falha ao buscar inscrições com pendências do aluno: ${e.message}`,
      );
    }
  }
}
