import { Inscricao } from 'src/entities/inscricao/inscricao.entity';
import { CreateInscricaoDto } from './dto/create-inscricao-dto';
import { EntityManager, In, Repository } from 'typeorm';
import { Aluno } from 'src/entities/aluno/aluno.entity';
import { Edital } from 'src/entities/edital/edital.entity';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Documento } from 'src/entities/documento/documento.entity';
import { Resposta } from 'src/entities/inscricao/resposta.entity';
import { InscricaoResponseDto } from './dto/response-inscricao.dto';
import { plainToInstance } from 'class-transformer';
import { UpdateInscricaoDto } from './dto/update-inscricao-dto';
import { Pergunta } from 'src/entities/edital/pergunta.entity';

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
    @InjectRepository(Resposta)
    private readonly respostaRepository: Repository<Resposta>,
    @InjectRepository(Pergunta)
    private readonly perguntaRepository: Repository<Pergunta>,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async createInscricao(
    createInscricaoDto: CreateInscricaoDto,
  ): Promise<InscricaoResponseDto> {
    try {
      const alunoExiste = await this.alunoRepository.findOne({
        where: { aluno_id: createInscricaoDto.aluno },
      });

      if (!alunoExiste) {
        throw new NotFoundException('Aluno não encontrado');
      }

      const editalExiste = await this.editalRepository.findOne({
        where: { id: createInscricaoDto.edital },
      });

      if (!editalExiste) {
        throw new NotFoundException('Edital não encontrado');
      }

      // Busca todas as perguntas do edital
      const perguntas = await this.perguntaRepository.find({
        where: {
          step: {
            edital: { id: editalExiste.id }
          }
        }
      });

      // Cria um mapa de perguntas por ID para fácil acesso
      const perguntasMap = new Map(perguntas.map(p => [p.id, p]));

      // Valida e associa as perguntas às respostas
      const respostas = await Promise.all(
        createInscricaoDto.respostas.map(async (respostaDto) => {
          const pergunta = perguntasMap.get(respostaDto.pergunta_id);
          
          if (!pergunta) {
            throw new NotFoundException(
              `Pergunta com ID ${respostaDto.pergunta_id} não encontrada no edital`
            );
          }

          return new Resposta({
            pergunta,
            texto: respostaDto.texto,
          });
        })
      );

      const inscricao = new Inscricao({
        aluno: alunoExiste,
        edital: editalExiste,
        respostas,
      });

      const result = await this.entityManager.transaction(
        async (transactionalEntityManager) => {
          // Salva a inscrição com as respostas em cascade
          const inscricaoSalva = await transactionalEntityManager.save(inscricao);

          // Cria documentos apenas se houver tipos de documentos definidos
          if (editalExiste.tipo_documentos && editalExiste.tipo_documentos.length > 0) {
            for (const tipo_documento of editalExiste.tipo_documentos) {
              const documento = new Documento({
                tipo_documento: tipo_documento,
                inscricao: inscricaoSalva,
              });
              await transactionalEntityManager.save(documento);
            }
          }

          return inscricaoSalva;
        },
      );

      return plainToInstance(InscricaoResponseDto, result, {
        excludeExtraneousValues: true,
      });
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
    updateInscricaoDto: UpdateInscricaoDto,
  ): Promise<InscricaoResponseDto> {
    try {
      const inscricaoExistente = await this.inscricaoRepository.findOne({
        where: { id: inscricaoId },
        relations: ['aluno', 'edital'],
      });

      if (!inscricaoExistente) {
        throw new NotFoundException('Inscrição não encontrada');
      }

      const alunoExiste = await this.alunoRepository.findOne({
        where: { aluno_id: updateInscricaoDto.aluno },
      });

      if (!alunoExiste) {
        throw new NotFoundException('Aluno não encontrado');
      }

      const editalExiste = await this.editalRepository.findOne({
        where: { id: updateInscricaoDto.edital },
      });

      if (!editalExiste) {
        throw new NotFoundException('Edital não encontrado');
      }

      const result = await this.entityManager.transaction(
        async (transactionalEntityManager) => {
          Object.assign(inscricaoExistente, updateInscricaoDto);
          const updatedInscricao =
            await transactionalEntityManager.save(inscricaoExistente);
          return updatedInscricao;
        },
      );

      return plainToInstance(InscricaoResponseDto, result, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      const e = error as Error;
      console.error('Falha ao editar a inscrição', error);
      throw new BadRequestException(
        `Falha ao editar a inscrição: ${e.message}`,
      );
    }
  }
}
