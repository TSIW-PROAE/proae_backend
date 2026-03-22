import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { EntityManager, In, Repository } from 'typeorm';
import { Step } from '../entities/step/step.entity';
import { InputFormatPlaceholders } from '../enum/enumInputFormat';
import { CreatePerguntaDto } from './dto/create-pergunta.dto';
import { UpdatePerguntaDto } from './dto/update-pergunta.dto';
import { PerguntaResponseDto } from '../step/dto/response-pergunta.dto';
import { Pergunta } from '../entities/pergunta/pergunta.entity';
import { Dado } from '../entities/tipoDado/tipoDado.entity';
import { Inscricao } from '../entities/inscricao/inscricao.entity';
import { Resposta } from '../entities/resposta/resposta.entity';
import { Vagas } from '../entities/vagas/vagas.entity';
import { StatusInscricao } from '../enum/enumStatusInscricao';

@Injectable()
export class PerguntaService {
  constructor(
    @InjectRepository(Pergunta)
    private readonly perguntaRepository: Repository<Pergunta>,
    @InjectRepository(Step) private readonly stepRepository: Repository<Step>,
    @InjectRepository(Dado) private readonly dadoRepository: Repository<Dado>,
    @InjectRepository(Inscricao)
    private readonly inscricaoRepository: Repository<Inscricao>,
    @InjectRepository(Resposta)
    private readonly respostaRepository: Repository<Resposta>,
    @InjectRepository(Vagas)
    private readonly vagasRepository: Repository<Vagas>,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  // Listar perguntas de um step específico
  async findByStep(stepId: string): Promise<PerguntaResponseDto[]> {
    try {
      const perguntas = await this.perguntaRepository.find({
        where: { step: { id: stepId } },
        relations: ['dado'], // Adiciona o relacionamento para carregar o dado
      });

      // if (!perguntas || perguntas.length === 0) {
      //   throw new NotFoundException(`Nenhuma pergunta encontrada para o step com ID ${stepId}. Verifique se o step existe e possui perguntas cadastradas.`);
      // }

      // Transform perguntas and calculate placeholder
      return perguntas.map((pergunta) => {
        const perguntaDto = plainToInstance(PerguntaResponseDto, pergunta, {
          excludeExtraneousValues: true,
        });

        perguntaDto.placeholder =
          InputFormatPlaceholders[pergunta.tipo_formatacao];

        return perguntaDto;
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Erro ao buscar perguntas:', error);
      throw new InternalServerErrorException();
    }
  }

  // Criar uma nova pergunta
  async create(
    createPerguntaDto: CreatePerguntaDto,
  ): Promise<PerguntaResponseDto> {
    try {
      // Verificar se o step existe
      const step = await this.stepRepository.findOne({
        where: { id: createPerguntaDto.step_id },
        relations: ['edital'],
      });

      if (!step) {
        throw new NotFoundException(
          `Step com ID ${createPerguntaDto.step_id} não encontrado. Verifique se o step existe e tente novamente.`,
        );
      }

      let dado: Dado | null = null;
      if (createPerguntaDto.dadoId) {
        dado = await this.dadoRepository.findOneBy({
          id: createPerguntaDto.dadoId,
        });

        if (!dado) {
          throw new NotFoundException('Dado não encontrado');
        }
      }

      // Verificar se já existem inscrições com respostas neste edital
      const inscricoesComRespostas =
        await this.buscarInscricoesComRespostasNoEdital(step.edital.id);

      if (inscricoesComRespostas.length > 0 && !createPerguntaDto.prazoResposta) {
        throw new BadRequestException(
          'Já existem inscrições com respostas neste edital. É obrigatório informar o prazoResposta para que os alunos já inscritos possam responder a nova pergunta.',
        );
      }

      const pergunta = this.perguntaRepository.create({
        tipo_Pergunta: createPerguntaDto.tipo_Pergunta,
        pergunta: createPerguntaDto.pergunta,
        obrigatoriedade: createPerguntaDto.obrigatoriedade,
        opcoes: createPerguntaDto.opcoes,
        tipo_formatacao: createPerguntaDto.tipo_formatacao,
        step: step,
        dado: dado ?? undefined,
      });

      const savedPergunta = await this.perguntaRepository.save(pergunta);

      // Se existem inscrições com respostas, criar respostas vazias e atualizar status
      if (inscricoesComRespostas.length > 0) {
        await this.criarRespostasParaInscricoesExistentes(
          savedPergunta,
          inscricoesComRespostas,
          new Date(createPerguntaDto.prazoResposta!),
        );
      }

      const perguntaDto = plainToInstance(PerguntaResponseDto, savedPergunta, {
        excludeExtraneousValues: true,
      });

      perguntaDto.placeholder =
        InputFormatPlaceholders[savedPergunta.tipo_formatacao];

      return perguntaDto;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Erro ao criar pergunta:', error);
      throw new InternalServerErrorException();
    }
  }

  // Atualizar uma pergunta
  async update(
    id: string,
    updatePerguntaDto: UpdatePerguntaDto,
  ): Promise<PerguntaResponseDto> {
    try {
      const pergunta = await this.perguntaRepository.findOne({
        where: { id },
        relations: ['dado'], // Carregar o relacionamento atual
      });

      if (!pergunta) {
        throw new NotFoundException('Pergunta não encontrada');
      }

      // Se dadoId foi fornecido no DTO, validar e atualizar o relacionamento
      let dado: Dado | null = null;
      if (updatePerguntaDto.dadoId !== undefined) {
        if (
          updatePerguntaDto.dadoId !== null &&
          updatePerguntaDto.dadoId !== undefined
        ) {
          dado = await this.dadoRepository.findOneBy({
            id: updatePerguntaDto.dadoId,
          });

          if (!dado) {
            throw new NotFoundException(
              `Dado com ID ${updatePerguntaDto.dadoId} não encontrado`,
            );
          }
        }
        // Se dadoId for null ou undefined, o relacionamento será removido (dado = null)
      } else {
        // Se dadoId não foi fornecido, manter o relacionamento atual
        dado = pergunta.dado || null;
      }

      await this.entityManager.transaction(
        async (transactionalEntityManager) => {
          // Atualizar os campos básicos
          Object.assign(pergunta, {
            ...updatePerguntaDto,
            dado: updatePerguntaDto.dadoId !== undefined ? dado : pergunta.dado,
          });

          // Remover dadoId do objeto antes de salvar (não é uma propriedade da entidade)
          delete (pergunta as any).dadoId;

          await transactionalEntityManager.save(pergunta);
        },
      );

      // Busca os dados atualizados
      const updatedPergunta = await this.perguntaRepository.findOne({
        where: { id },
        relations: ['dado'], // Carregar o relacionamento atualizado
      });

      if (!updatedPergunta) {
        throw new InternalServerErrorException(
          'Erro ao buscar pergunta atualizada',
        );
      }

      const perguntaDto = plainToInstance(
        PerguntaResponseDto,
        updatedPergunta,
        {
          excludeExtraneousValues: true,
        },
      );

      perguntaDto.placeholder =
        InputFormatPlaceholders[updatedPergunta.tipo_formatacao];

      return perguntaDto;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Erro ao atualizar pergunta:', error);
      throw new InternalServerErrorException();
    }
  }

  // Remover uma pergunta
  async remove(id: string): Promise<{ message: string }> {
    try {
      const pergunta = await this.perguntaRepository.findOne({
        where: { id },
      });

      if (!pergunta) {
        throw new NotFoundException('Pergunta não encontrada');
      }

      await this.perguntaRepository.delete({ id });

      return { message: 'Pergunta removida com sucesso' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Erro ao remover pergunta:', error);
      throw new InternalServerErrorException();
    }
  }

  /**
   * Busca todas as inscrições que já possuem respostas em perguntas do edital.
   */
  private async buscarInscricoesComRespostasNoEdital(
    editalId: string,
  ): Promise<Inscricao[]> {
    const vagas = await this.vagasRepository.find({
      where: { edital: { id: editalId } },
    });

    if (!vagas || vagas.length === 0) return [];

    const vagaIds = vagas.map((v) => v.id);

    const inscricoes = await this.inscricaoRepository.find({
      where: {
        vagas: { id: In(vagaIds) },
      },
      relations: ['respostas', 'respostas.pergunta'],
    });

    // Filtrar apenas inscrições que possuem pelo menos uma resposta
    return inscricoes.filter(
      (inscricao) => inscricao.respostas && inscricao.respostas.length > 0,
    );
  }

  /**
   * Cria respostas vazias (pendentes) para cada inscrição existente
   * e atualiza o status das inscrições para AGUARDANDO_COMPLEMENTO.
   */
  private async criarRespostasParaInscricoesExistentes(
    pergunta: Pergunta,
    inscricoes: Inscricao[],
    prazoResposta: Date,
  ): Promise<void> {
    await this.entityManager.transaction(async (transactionalEntityManager) => {
      // Criar respostas vazias para cada inscrição usando query direta para garantir FKs
      for (const inscricao of inscricoes) {
        await transactionalEntityManager.query(
          `INSERT INTO resposta ("perguntaId", "inscricaoId", "validada", "invalidada", "requerReenvio", "perguntaAdicionadaPosInscricao", "prazoRespostaNovaPergunta")
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [pergunta.id, inscricao.id, false, false, false, true, prazoResposta],
        );
      }

      // Atualizar o status para AGUARDANDO_COMPLEMENTO apenas para inscrições que NÃO estão rejeitadas.
      // Inscrições com status REJEITADA ou REJEITADA_PRAZO_COMPLEMENTO mantêm seu status — 
      // a rejeição tem prioridade e só é revertida quando o admin valida a resposta que causou a rejeição.
      const inscricaoIds = inscricoes.map((i) => i.id);
      await transactionalEntityManager.query(
        `UPDATE inscricao SET status_inscricao = $1
         WHERE id = ANY($2::uuid[])
           AND status_inscricao NOT IN ($3, $4)`,
        [
          StatusInscricao.AGUARDANDO_COMPLEMENTO,
          inscricaoIds,
          StatusInscricao.REJEITADA,
          StatusInscricao.REJEITADA_PRAZO_COMPLEMENTO,
        ],
      );
    });
  }
}
