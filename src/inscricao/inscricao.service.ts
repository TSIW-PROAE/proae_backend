import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { EntityManager, Repository } from 'typeorm';
import { Aluno } from '../entities/aluno/aluno.entity';
import { Edital } from '../entities/edital/edital.entity';
import { Pergunta } from '../entities/pergunta/pergunta.entity';
import { Inscricao } from '../entities/inscricao/inscricao.entity';
import { Resposta } from '../entities/resposta/resposta.entity';
import { Vagas } from '../entities/vagas/vagas.entity';
import { StatusEdital } from '../enum/enumStatusEdital';
import { StatusDocumento } from '../enum/statusDocumento';
import { CreateInscricaoDto } from './dto/create-inscricao-dto';
import { InscricaoResponseDto } from './dto/response-inscricao.dto';
import { UpdateInscricaoDto } from './dto/update-inscricao-dto';
import { RedisService } from '../redis/redis.service';

export class InscricaoService {
  constructor(
    @InjectRepository(Inscricao)
    private readonly inscricaoRepository: Repository<Inscricao>,
    @InjectRepository(Aluno)
    private readonly alunoRepository: Repository<Aluno>,
    @InjectRepository(Vagas)
    private readonly vagasRepository: Repository<Vagas>,
    @InjectRepository(Edital)
    private readonly editalRepository: Repository<Edital>,
    @InjectRepository(Pergunta)
    private readonly perguntaRepository: Repository<Pergunta>,
    @InjectRepository(Resposta)
    private readonly respostaRepository: Repository<Resposta>,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
    private readonly redisService: RedisService,
  ) {}

  async createInscricao(
    createInscricaoDto: CreateInscricaoDto,
    userId: number,
  ): Promise<InscricaoResponseDto> {
    try {
      // Validação do aluno
      const alunoExists = await this.alunoRepository.findOneBy({
        aluno_id: userId,
      });

      if (!alunoExists) {
        throw new NotFoundException('Aluno não encontrado');
      }

      // Validação da vaga
      const vagaExists = await this.vagasRepository.findOne({
        where: { id: createInscricaoDto.vaga_id },
        relations: ['edital'],
      });

      if (!vagaExists) {
        throw new NotFoundException('Vaga não encontrada');
      }

      // Validação do status do edital
      if (vagaExists.edital.status_edital !== StatusEdital.ABERTO) {
        throw new BadRequestException('Edital não está aberto para inscrições');
      }

      // Busca todas as perguntas do edital através das vagas
      const perguntas = await this.perguntaRepository.find({
        where: {
          step: {
            edital: { id: vagaExists.edital.id },
          },
        },
      });

      // Cria um mapa de perguntas por ID para fácil acesso
      const perguntasMap = new Map(perguntas.map((p) => [p.id, p]));

      // Validação das respostas
      if (
        !createInscricaoDto.respostas ||
        !createInscricaoDto.respostas.length
      ) {
        throw new BadRequestException(
          'É necessário fornecer respostas para as perguntas do edital',
        );
      }

      // Valida e associa as perguntas às respostas
      const respostas = await Promise.all(
        createInscricaoDto.respostas.map(async (respostaDto) => {
          const pergunta = perguntasMap.get(respostaDto.perguntaId);

          if (!pergunta) {
            throw new NotFoundException(
              `Pergunta com ID ${respostaDto.perguntaId} não encontrada no edital`,
            );
          }

          // Validação baseada no tipo de pergunta
          this.validateRespostaByTipoPergunta(respostaDto, pergunta);

          const resposta = new Resposta();
          resposta.pergunta = pergunta;
          resposta.valorTexto = respostaDto.valorTexto;
          resposta.valorOpcoes = respostaDto.valorOpcoes;
          resposta.urlArquivo = respostaDto.urlArquivo;
          resposta.texto = respostaDto.valorTexto; // Para compatibilidade
          return resposta;
        }),
      );

      const inscricao = new Inscricao({
        aluno: alunoExists,
        vagas: vagaExists,
        respostas,
      });

      const result = await this.entityManager.transaction(
        async (transactionalEntityManager) => {
          // Salva a inscrição com as respostas em cascade
          const inscricaoSalva =
            await transactionalEntityManager.save(inscricao);

          return inscricaoSalva;
        },
      );

      await this.removeRespostaEmCache(createInscricaoDto.vaga_id, userId);

      return plainToInstance(InscricaoResponseDto, result, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      console.error('Falha ao submeter uma inscrição', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Ocorreu um erro ao processar sua inscrição. Por favor, tente novamente mais tarde.',
      );
    }
  }

  async updateInscricao(
    inscricaoId: number,
    updateInscricaoDto: UpdateInscricaoDto,
    userId: number,
  ): Promise<InscricaoResponseDto> {
    try {
      // Validação da inscrição
      const inscricaoExistente = await this.inscricaoRepository.findOne({
        where: { id: inscricaoId },
        relations: ['aluno', 'vagas', 'vagas.edital', 'respostas'],
      });

      if (!inscricaoExistente) {
        throw new NotFoundException('Inscrição não encontrada');
      }

      // Verifica se o aluno é o dono da inscrição
      if (inscricaoExistente.aluno.aluno_id !== userId) {
        throw new BadRequestException(
          'Você não tem permissão para editar esta inscrição',
        );
      }

      // Validação da vaga se fornecida
      if (updateInscricaoDto.vaga_id) {
        const vagaExists = await this.vagasRepository.findOne({
          where: { id: updateInscricaoDto.vaga_id },
          relations: ['edital'],
        });

        if (!vagaExists) {
          throw new NotFoundException('Vaga não encontrada');
        }

        // Validação do status do edital
        if (vagaExists.edital.status_edital !== StatusEdital.ABERTO) {
          throw new BadRequestException(
            'Edital não está aberto para atualizações',
          );
        }

        inscricaoExistente.vagas = vagaExists;
      }

      // Atualização das respostas se fornecidas
      if (
        updateInscricaoDto.respostas &&
        updateInscricaoDto.respostas.length > 0
      ) {
        const perguntas = await this.perguntaRepository.find({
          where: {
            step: {
              edital: { id: inscricaoExistente.vagas.edital.id },
            },
          },
        });

        const perguntasMap = new Map(perguntas.map((p) => [p.id, p]));

        // Cria novas respostas
        const novasRespostas = await Promise.all(
          updateInscricaoDto.respostas.map(async (respostaDto) => {
            const pergunta = perguntasMap.get(respostaDto.perguntaId);

            if (!pergunta) {
              throw new NotFoundException(
                `Pergunta com ID ${respostaDto.perguntaId} não encontrada no edital`,
              );
            }

            this.validateRespostaByTipoPergunta(respostaDto, pergunta);

            const resposta = new Resposta();
            resposta.pergunta = pergunta;
            resposta.valorTexto = respostaDto.valorTexto;
            resposta.valorOpcoes = respostaDto.valorOpcoes;
            resposta.urlArquivo = respostaDto.urlArquivo;
            resposta.texto = respostaDto.valorTexto;
            return resposta;
          }),
        );

        // Remove respostas antigas e adiciona novas
        await this.respostaRepository.delete({
          inscricao: { id: inscricaoId },
        });
        inscricaoExistente.respostas = novasRespostas;
      }

      // Atualização das respostas editadas se fornecidas
      if (
        updateInscricaoDto.respostas_editadas &&
        updateInscricaoDto.respostas_editadas.length > 0
      ) {
        for (const respostaDto of updateInscricaoDto.respostas_editadas) {
          const respostaExistente = await this.respostaRepository.findOne({
            where: {
              pergunta: { id: respostaDto.perguntaId },
              inscricao: { id: inscricaoId },
            },
          });

          if (!respostaExistente) {
            throw new NotFoundException(
              `Resposta para a pergunta ${respostaDto.perguntaId} não encontrada na inscrição`,
            );
          }

          // Atualiza os campos fornecidos
          if (respostaDto.valorTexto !== undefined) {
            respostaExistente.valorTexto = respostaDto.valorTexto;
            respostaExistente.texto = respostaDto.valorTexto;
          }
          if (respostaDto.valorOpcoes !== undefined) {
            respostaExistente.valorOpcoes = respostaDto.valorOpcoes;
          }
          if (respostaDto.urlArquivo !== undefined) {
            respostaExistente.urlArquivo = respostaDto.urlArquivo;
          }

          await this.respostaRepository.save(respostaExistente);
        }
      }

      // Atualiza os dados básicos da inscrição
      if (updateInscricaoDto.data_inscricao !== undefined) {
        inscricaoExistente.data_inscricao = updateInscricaoDto.data_inscricao;
      }
      if (updateInscricaoDto.status_inscricao !== undefined) {
        inscricaoExistente.status_inscricao =
          updateInscricaoDto.status_inscricao;
      }

      const result = await this.entityManager.transaction(
        async (transactionalEntityManager) => {
          // Salva a inscrição atualizada
          const inscricaoAtualizada =
            await transactionalEntityManager.save(inscricaoExistente);

          return inscricaoAtualizada;
        },
      );

      return plainToInstance(InscricaoResponseDto, result, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      console.error('Falha ao atualizar a inscrição', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Ocorreu um erro ao processar a atualização da inscrição. Por favor, tente novamente mais tarde.',
      );
    }
  }

  async getInscricoesByAluno(userId: number) {
    try {
      const aluno = await this.alunoRepository.findOne({
        where: { aluno_id: userId },
      });

      if (!aluno) {
        throw new NotFoundException('Aluno não encontrado');
      }

      const inscricoes = await this.inscricaoRepository.find({
        where: {
          aluno: { aluno_id: aluno.aluno_id },
          documentos: {
            status_documento: StatusDocumento.PENDENTE,
          },
        },
        relations: [
          'documentos',
          'documentos.validacoes',
          'vagas',
          'vagas.edital',
        ],
      });

      return inscricoes
        .map((inscricao) => ({
          titulo_edital: inscricao.vagas.edital.titulo_edital,
          tipo_edital: [inscricao.vagas.beneficio],
          documentos: inscricao.documentos
            .filter(
              (documento) =>
                documento.status_documento === StatusDocumento.PENDENTE,
            )
            .map((documento) => {
              // Pegar a validação mais recente (se houver)
              const validacaoMaisRecente =
                documento.validacoes && documento.validacoes.length > 0
                  ? documento.validacoes.sort(
                      (a, b) =>
                        new Date(b.data_validacao || 0).getTime() -
                        new Date(a.data_validacao || 0).getTime(),
                    )[0]
                  : null;

              return {
                tipo_documento: documento.tipo_documento,
                status_documento: documento.status_documento,
                documento_url: documento.documento_url,
                parecer: validacaoMaisRecente?.parecer || null,
                data_validacao: validacaoMaisRecente?.data_validacao || null,
              };
            }),
        }))
        .filter((inscricao) => inscricao.documentos.length > 0);
    } catch (error) {
      const e = error as Error;
      console.error(
        'Falha ao buscar inscrições com pendências do aluno',
        error,
      );

      // Preserva o tipo original da exceção se for NotFoundException
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new BadRequestException(
        `Falha ao buscar inscrições com pendências do aluno: ${e.message}`,
      );
    }
  }

  async saveRespostaEmCache(createInscricaoDto: CreateInscricaoDto, userId: number) {
    const vagaExists = await this.vagasRepository.findOne({
        where: { id: createInscricaoDto.vaga_id },
        relations: ['edital'],
    });

    if (!vagaExists) {
        throw new NotFoundException('Vaga não encontrada');
    }

    if (vagaExists.edital.status_edital !== StatusEdital.ABERTO) {
        throw new BadRequestException('Edital não está aberto para inscrições');
    }
    
    const key = `userId:${userId}:form:${createInscricaoDto.vaga_id}:edital:${vagaExists.edital.id}`;

    // Calcula a expiração baseada no fim do edi3tal
    let expirationInSeconds = 3 * 24 * 60 * 60; // 3 dias padrão
    
    expirationInSeconds = this.calculateExpirationBasedOnEdital(vagaExists, expirationInSeconds);
    
    await this.redisService.setValue(key, JSON.stringify(createInscricaoDto.respostas), expirationInSeconds);

    return { 
        message: 'Respostas salvas no cache com sucesso', 
        key,
        expirationInSeconds,
        expirationInHours: Math.ceil(expirationInSeconds / 3600)
    };
  }

  async findRespostaEmCache(vagaId: number, userId: number) {
    const vagaExists = await this.vagasRepository.findOne({
        where: { id: vagaId },
        relations: ['edital'],
    });

    if (!vagaExists) {
        throw new NotFoundException('Vaga não encontrada');
    }

    const key = `userId:${userId}:form:${vagaId}:edital:${vagaExists.edital.id}`;
    const cachedData = await this.redisService.getValue(key);
    
    if (!cachedData) {
        return { message: 'Nenhuma resposta encontrada no cache', respostas: [] };
    }
    
    try {
        const respostas = JSON.parse(cachedData);
        return { 
            message: 'Respostas encontradas no cache', 
            respostas: respostas,
        };
    } catch (error) {
        console.error('[CACHE] Erro ao fazer parse dos dados do cache:', error);
        return { message: 'Erro ao recuperar dados do cache', respostas: [] };
    }
  }

  async removeRespostaEmCache(vagaId: number, userId: number) {
    const vagaExists = await this.vagasRepository.findOne({
        where: { id: vagaId },
        relations: ['edital'],
    });

    if (!vagaExists) {
        throw new NotFoundException('Vaga não encontrada');
    }

    const key = `userId:${userId}:form:${vagaId}:edital:${vagaExists.edital.id}`;
    await this.redisService.deleteValue(key);

    return { message: 'Resposta removida do cache com sucesso', key };
  }

  private validateRespostaByTipoPergunta(respostaDto: any, pergunta: any) {
    // Validação baseada no tipo de pergunta
    switch (pergunta.tipo_Pergunta) {
      case 'text':
        if (!respostaDto.valorTexto || respostaDto.valorTexto.trim() === '') {
          throw new BadRequestException(
            `Resposta para a pergunta "${pergunta.pergunta}" não pode estar vazia`,
          );
        }
        break;
      case 'select':
        if (!respostaDto.valorOpcoes || respostaDto.valorOpcoes.length === 0) {
          throw new BadRequestException(
            `Resposta para a pergunta "${pergunta.pergunta}" deve ter pelo menos uma opção selecionada`,
          );
        }
        break;
      case 'file':
        if (!respostaDto.urlArquivo || respostaDto.urlArquivo.trim() === '') {
          throw new BadRequestException(
            `Resposta para a pergunta "${pergunta.pergunta}" deve incluir um arquivo`,
          );
        }
        break;
      default:
        if (!respostaDto.valorTexto || respostaDto.valorTexto.trim() === '') {
          throw new BadRequestException(
            `Resposta para a pergunta "${pergunta.pergunta}" não pode estar vazia`,
          );
        }
    }
  }
  
  private calculateExpirationBasedOnEdital(vagaExists: Vagas, expirationInSeconds: number): number {
    const today = new Date();
    const editalSteps = vagaExists.edital.etapa_edital;
    const threeDaysInSeconds = 3 * 24 * 60 * 60;

    // Retorna se não há etapas ou não é um array
    if (!editalSteps || !Array.isArray(editalSteps)) {
      return expirationInSeconds;
    }

    // Encontra a etapa atual (ativa)
    const currentStep = editalSteps.find(step => {
      const startDate = new Date(step.data_inicio);
      const endDate = new Date(step.data_fim);
      return startDate <= today && endDate >= today;
    });

    // Retorna se nenhuma etapa ativa foi encontrada
    if (!currentStep) {
      return expirationInSeconds;
    }

    // Calcula o tempo restante até o fim da etapa
    const stepEndDate = new Date(currentStep.data_fim);
    const remainingTimeMs = stepEndDate.getTime() - today.getTime();
    const remainingTimeSeconds = Math.floor(remainingTimeMs / 1000);

    // Retorna se o tempo restante é inválido
    if (remainingTimeSeconds <= 0) {
      return expirationInSeconds;
    }

    // Se o edital termina em menos de 3 dias, usa o tempo até o fim
    if (remainingTimeSeconds < threeDaysInSeconds) {
      return remainingTimeSeconds;
    }

    // Se termina em mais de 3 dias, usa o padrão
    return expirationInSeconds;
  }
}
