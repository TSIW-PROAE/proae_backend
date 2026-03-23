import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UpdateAdminInscricaoStatusDto } from './dto/update-admin-inscricao-status.dto';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { EntityManager, Repository } from 'typeorm';
import type { CachePort } from 'src/core/application/utilities/ports/cache.port';
import { CACHE_PORT } from 'src/core/application/utilities/utility.tokens';
import { StatusEdital } from 'src/core/shared-kernel/enums/enumStatusEdital';
import { StatusDocumento } from 'src/core/shared-kernel/enums/statusDocumento';
import { Aluno } from 'src/infrastructure/persistence/typeorm/entities/aluno/aluno.entity';
import { Edital } from 'src/infrastructure/persistence/typeorm/entities/edital/edital.entity';
import { Inscricao } from 'src/infrastructure/persistence/typeorm/entities/inscricao/inscricao.entity';
import { Pergunta } from 'src/infrastructure/persistence/typeorm/entities/pergunta/pergunta.entity';
import { Resposta } from 'src/infrastructure/persistence/typeorm/entities/resposta/resposta.entity';
import { Vagas } from 'src/infrastructure/persistence/typeorm/entities/vagas/vagas.entity';
import { CreateInscricaoDto } from './dto/create-inscricao-dto';
import { InscricaoResponseDto } from './dto/response-inscricao.dto';
import { UpdateInscricaoDto } from './dto/update-inscricao-dto';
import { InscricaoAuditLogService } from '../inscricao-audit/inscricao-audit-log.service';
import { StatusBeneficioEdital } from 'src/core/shared-kernel/enums/enumStatusBeneficioEdital';
import { StatusInscricao } from 'src/core/shared-kernel/enums/enumStatusInscricao';

@Injectable()
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
    @Inject(CACHE_PORT)
    private readonly redisService: CachePort,
    private readonly inscricaoAuditLog: InscricaoAuditLogService,
  ) {}

  async createInscricao(
    createInscricaoDto: CreateInscricaoDto,
    userId: string,
  ): Promise<InscricaoResponseDto> {
    try {
      const alunoExists = await this.alunoRepository.findOne({ where: { usuario: { usuario_id: userId } } });
      if (!alunoExists) throw new NotFoundException('Aluno não encontrado');

      const vagaExists = await this.vagasRepository.findOne({
        where: { id: createInscricaoDto.vaga_id },
        relations: ['edital'],
      });
      if (!vagaExists) throw new NotFoundException('Vaga não encontrada');

      if (vagaExists.edital.status_edital !== StatusEdital.ABERTO) {
        throw new BadRequestException('Edital não está aberto para inscrições');
      }

      if (alunoExists.nivel_academico !== vagaExists.edital.nivel_academico) {
        throw new BadRequestException(
          'O nível acadêmico deste processo (Graduação / Pós-graduação) não corresponde ao seu perfil de estudante.',
        );
      }

      const perguntas = await this.perguntaRepository.find({
        where: {
          step: {
            edital: { id: vagaExists.edital.id },
          },
        },
      });

      const perguntasMap = new Map(perguntas.map((p) => [p.id, p]));

      if (!createInscricaoDto.respostas || !createInscricaoDto.respostas.length) {
        throw new BadRequestException(
          'É necessário fornecer respostas para as perguntas do edital',
        );
      }

      const respostas = await Promise.all(
        createInscricaoDto.respostas.map(async (respostaDto) => {
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

      const inscricao = new Inscricao({
        aluno: alunoExists,
        vagas: vagaExists,
        respostas,
      });

      const result = await this.entityManager.transaction(
        async (transactionalEntityManager) => {
          return await transactionalEntityManager.save(inscricao);
        },
      );

      await this.removeRespostaEmCache(
        createInscricaoDto.vaga_id,
        typeof userId === 'string' ? parseInt(userId, 10) : userId,
      );

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
    userId: string,
  ): Promise<InscricaoResponseDto> {
    try {
      const inscricaoExistente = await this.inscricaoRepository.findOne({
        where: { id: inscricaoId },
        relations: ['aluno', 'vagas', 'vagas.edital', 'respostas'],
      });

      if (!inscricaoExistente) {
        throw new NotFoundException('Inscrição não encontrada');
      }

      if (inscricaoExistente.aluno.usuario.usuario_id !== userId) {
        throw new BadRequestException(
          'Você não tem permissão para editar esta inscrição',
        );
      }

      if (updateInscricaoDto.vaga_id) {
        const vagaExists = await this.vagasRepository.findOne({
          where: { id: updateInscricaoDto.vaga_id },
          relations: ['edital'],
        });

        if (!vagaExists) {
          throw new NotFoundException('Vaga não encontrada');
        }

        if (vagaExists.edital.status_edital !== StatusEdital.ABERTO) {
          throw new BadRequestException(
            'Edital não está aberto para atualizações',
          );
        }

        inscricaoExistente.vagas = vagaExists;
      }

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

        await this.respostaRepository.delete({
          inscricao: { id: inscricaoId },
        });
        inscricaoExistente.respostas = novasRespostas;
      }

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

      if (updateInscricaoDto.data_inscricao !== undefined) {
        inscricaoExistente.data_inscricao = updateInscricaoDto.data_inscricao;
      }
      if (updateInscricaoDto.status_inscricao !== undefined) {
        inscricaoExistente.status_inscricao =
          updateInscricaoDto.status_inscricao;
      }

      const result = await this.entityManager.transaction(
        async (transactionalEntityManager) => {
          return await transactionalEntityManager.save(inscricaoExistente);
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

  async getInscricoesByAluno(userId: string) {
    try {
      const aluno = await this.alunoRepository.findOne({
        where: { usuario: { usuario_id: userId } },
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
    let expirationInSeconds = 3 * 24 * 60 * 60;
    expirationInSeconds = this.calculateExpirationBasedOnEdital(vagaExists, expirationInSeconds);
    await this.redisService.setValue(key, JSON.stringify(createInscricaoDto.respostas), expirationInSeconds);

    return {
      message: 'Respostas salvas no cache com sucesso',
      key,
      expirationInSeconds,
      expirationInHours: Math.ceil(expirationInSeconds / 3600),
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
      const respostas =
        typeof cachedData === 'string'
          ? JSON.parse(cachedData)
          : cachedData;
      return {
        message: 'Respostas encontradas no cache',
        respostas: Array.isArray(respostas) ? respostas : [],
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

  /**
   * [Admin] Atualiza status e observação sem checagem de dono da inscrição
   * (válido para editais comuns, Formulário Geral e Renovação).
   */
  async adminUpdateInscricaoStatus(
    inscricaoId: number,
    dto: UpdateAdminInscricaoStatusDto,
    actorUsuarioId?: string | null,
  ): Promise<{
    id: number;
    status_inscricao: string;
    observacao_admin?: string | null;
  }> {
    const inscricao = await this.inscricaoRepository.findOne({
      where: { id: inscricaoId },
      relations: ['vagas', 'vagas.edital'],
    });
    if (!inscricao) {
      throw new NotFoundException('Inscrição não encontrada');
    }
    const statusAnterior = inscricao.status_inscricao;
    inscricao.status_inscricao = dto.status;
    if (dto.observacao !== undefined) {
      inscricao.observacao_admin = dto.observacao;
    }
    const saved = await this.entityManager.transaction(async (tx) =>
      tx.save(inscricao),
    );

    await this.inscricaoAuditLog.logStatusChange({
      inscricaoId,
      actorUsuarioId: actorUsuarioId ?? null,
      statusAnterior,
      statusNovo: dto.status,
      observacao: dto.observacao ?? null,
    });

    return {
      id: saved.id,
      status_inscricao: saved.status_inscricao,
      observacao_admin: saved.observacao_admin ?? null,
    };
  }

  /**
   * [Admin] Atualiza só a situação de **benefício no edital** (seleção/homologação).
   */
  async adminUpdateBeneficioEdital(
    inscricaoId: number,
    statusBeneficio: StatusBeneficioEdital,
  ): Promise<{
    id: number;
    status_beneficio_edital: string;
  }> {
    const inscricao = await this.inscricaoRepository.findOne({
      where: { id: inscricaoId },
      relations: ['vagas', 'vagas.edital'],
    });
    if (!inscricao) {
      throw new NotFoundException('Inscrição não encontrada');
    }
    const edital = inscricao.vagas?.edital;
    if (edital?.is_formulario_geral || edital?.is_formulario_renovacao) {
      throw new BadRequestException(
        'Situação de benefício no edital não se aplica a Formulário Geral ou Renovação. Use apenas o status da inscrição.',
      );
    }
    if (statusBeneficio === StatusBeneficioEdital.BENEFICIARIO) {
      if (inscricao.status_inscricao !== StatusInscricao.APROVADA) {
        throw new BadRequestException(
          'Só é possível homologar como beneficiário no edital depois que a inscrição estiver aprovada na análise (status "Inscrição Aprovada").',
        );
      }
    }
    inscricao.status_beneficio_edital = statusBeneficio;
    const saved = await this.entityManager.transaction(async (tx) =>
      tx.save(inscricao),
    );
    return {
      id: saved.id,
      status_beneficio_edital: saved.status_beneficio_edital,
    };
  }

  private calculateExpirationBasedOnEdital(vagaExists: Vagas, expirationInSeconds: number): number {
    const today = new Date();
    const editalSteps = vagaExists.edital.etapa_edital;
    const threeDaysInSeconds = 3 * 24 * 60 * 60;

    if (!editalSteps || !Array.isArray(editalSteps)) {
      return expirationInSeconds;
    }

    const currentStep = editalSteps.find((step) => {
      const startDate = new Date(step.data_inicio);
      const endDate = new Date(step.data_fim);
      return startDate <= today && endDate >= today;
    });

    if (!currentStep) {
      return expirationInSeconds;
    }

    const stepEndDate = new Date(currentStep.data_fim);
    const remainingTimeMs = stepEndDate.getTime() - today.getTime();
    const remainingTimeSeconds = Math.floor(remainingTimeMs / 1000);

    if (remainingTimeSeconds <= 0) {
      return expirationInSeconds;
    }

    if (remainingTimeSeconds < threeDaysInSeconds) {
      return remainingTimeSeconds;
    }

    return expirationInSeconds;
  }
}
