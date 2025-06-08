import { Inscricao } from 'src/entities/inscricao/inscricao.entity';
import { CreateInscricaoDto } from './dto/create-inscricao-dto';
import { EntityManager, In, Repository } from 'typeorm';
import { Aluno } from 'src/entities/aluno/aluno.entity';
import { Edital } from 'src/entities/edital/edital.entity';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { Documento } from 'src/entities/documento/documento.entity';
import { Resposta } from 'src/entities/inscricao/resposta.entity';
import { InscricaoResponseDto } from './dto/response-inscricao.dto';
import { plainToInstance } from 'class-transformer';
import { UpdateInscricaoDto } from './dto/update-inscricao-dto';
import { Pergunta } from 'src/entities/edital/pergunta.entity';
import { StatusEdital } from 'src/enum/enumStatusEdital';

export class InscricaoService {
  constructor(
    @InjectRepository(Inscricao)
    private readonly inscricaoRepository: Repository<Inscricao>,
    @InjectRepository(Aluno)
    private readonly alunoRepository: Repository<Aluno>,
    @InjectRepository(Edital)
    private readonly editalRepository: Repository<Edital>,
    @InjectRepository(Pergunta)
    private readonly perguntaRepository: Repository<Pergunta>,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async createInscricao(
    createInscricaoDto: CreateInscricaoDto,
  ): Promise<InscricaoResponseDto> {
    try {
      // Validação do aluno
      const alunoExiste = await this.alunoRepository.findOne({
        where: { aluno_id: createInscricaoDto.aluno },
      });

      if (!alunoExiste) {
        throw new NotFoundException('Aluno não encontrado');
      }

      // Validação do edital
      const editalExiste = await this.editalRepository.findOne({
        where: { id: createInscricaoDto.edital },
      });

      if (!editalExiste) {
        throw new NotFoundException('Edital não encontrado');
      }

      // Validação do status do edital
      if (editalExiste.status_edital !== StatusEdital.ABERTO) {
        throw new BadRequestException('Edital não está aberto para inscrições');
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

      // Validação das respostas
      if (!createInscricaoDto.respostas || !createInscricaoDto.respostas.length) {
        throw new BadRequestException('É necessário fornecer respostas para as perguntas do edital');
      }

      // Valida e associa as perguntas às respostas
      const respostas = await Promise.all(
        createInscricaoDto.respostas.map(async (respostaDto) => {
          const pergunta = perguntasMap.get(respostaDto.pergunta_id);
          
          if (!pergunta) {
            throw new NotFoundException(
              `Pergunta com ID ${respostaDto.pergunta_id} não encontrada no edital`
            );
          }

          if (!respostaDto.texto || respostaDto.texto.trim() === '') {
            throw new BadRequestException(
              `Resposta para a pergunta ${pergunta.pergunta} não pode estar vazia`
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
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      
      console.error('Falha ao submeter uma inscrição', error);
      throw new InternalServerErrorException(
        'Ocorreu um erro ao processar sua inscrição. Por favor, tente novamente mais tarde.'
      );
    }
  }

  async updateInscricao(
    inscricaoId: number,
    updateInscricaoDto: UpdateInscricaoDto,
  ): Promise<InscricaoResponseDto> {
    try {
      // Validação da inscrição
      const inscricaoExistente = await this.inscricaoRepository.findOne({
        where: { id: inscricaoId },
        relations: ['aluno', 'edital', 'respostas'],
      });

      if (!inscricaoExistente) {
        throw new NotFoundException('Inscrição não encontrada');
      }

      // Validação do aluno
      const alunoExiste = await this.alunoRepository.findOne({
        where: { aluno_id: updateInscricaoDto.aluno },
      });

      if (!alunoExiste) {
        throw new NotFoundException('Aluno não encontrado');
      }

      // Validação do edital
      const editalExiste = await this.editalRepository.findOne({
        where: { id: updateInscricaoDto.edital },
      });

      if (!editalExiste) {
        throw new NotFoundException('Edital não encontrado');
      }

      // Validação do status do edital
      if (editalExiste.status_edital !== StatusEdital.ABERTO) {
        throw new BadRequestException('Edital não está aberto para atualizações');
      }

      // Atualiza os dados básicos da inscrição
      Object.assign(inscricaoExistente, {
        aluno: alunoExiste,
        edital: editalExiste,
        data_inscricao: updateInscricaoDto.data_inscricao,
        status_inscricao: updateInscricaoDto.status_inscricao,
      });

      const result = await this.entityManager.transaction(
        async (transactionalEntityManager) => {
          // Salva a inscrição atualizada
          const inscricaoAtualizada = await transactionalEntityManager.save(inscricaoExistente);

          return inscricaoAtualizada;
        },
      );

      return plainToInstance(InscricaoResponseDto, result, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      
      console.error('Falha ao atualizar a inscrição', error);
      throw new InternalServerErrorException(
        'Ocorreu um erro ao processar a atualização da inscrição. Por favor, tente novamente mais tarde.'
      );
    }
  }
}
