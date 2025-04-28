import { Inscricao } from 'src/entities/inscricao/inscricao.entity';
import { CreateInscricaoDto } from './dto/create-inscricao-dto';
import { In, Repository } from 'typeorm';
import { Aluno } from 'src/entities/aluno/aluno.entity';
import { Edital } from 'src/entities/edital/edital.entity';
import { Formulario } from 'src/entities/formulario/formulario.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Documento } from 'src/entities/documento/documento.entity';

export class InscricaoService {
  constructor(
    @InjectRepository(Inscricao)
    private readonly inscricaoRepository: Repository<Inscricao>,
    @InjectRepository(Aluno)
    private readonly alunoRepository: Repository<Aluno>,
    @InjectRepository(Edital)
    private readonly editalRepository: Repository<Edital>,
    @InjectRepository(Formulario)
    private readonly formularioRepository: Repository<Formulario>,
    @InjectRepository(Documento)
    private readonly documentoRepository: Repository<Documento>,
  ) {}
  async createInscricao(createInscricaoDto: CreateInscricaoDto) {
    try {
      const { aluno, edital, data_inscricao, formulario, documentos } =
        createInscricaoDto;

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

      if (formulario) {
        const formulario_final = await this.formularioRepository.findOne({
          where: { formulario_id: formulario },
        });
        if (formulario_final) {
          inscricao.formulario = formulario_final;
        } else {
          throw new NotFoundException('Formulário não encontrado');
        }
      }

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
      const { aluno, edital, data_inscricao, formulario, documentos } =
        updateInscricaoDto;

      const inscricaoExistente = await this.inscricaoRepository.findOne({
        where: { inscricao_id: inscricaoId },
        relations: ['aluno', 'edital', 'formulario', 'documentos'],
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

      if (formulario) {
        const formularioFinal = await this.formularioRepository.findOne({
          where: { formulario_id: formulario },
        });
        if (formularioFinal) {
          inscricaoExistente.formulario = formularioFinal;
        } else {
          throw new NotFoundException('Formulário não encontrado');
        }
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
}
