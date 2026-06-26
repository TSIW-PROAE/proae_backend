import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UpdateAdminInscricaoStatusDto } from './dto/update-admin-inscricao-status.dto';
import { UpdateAdminInscricaoBeneficioDto } from './dto/update-admin-inscricao-beneficio.dto';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { EntityManager, Repository } from 'typeorm';
import type { CachePort } from 'src/core/application/utilities/ports/cache.port';
import type { EmailSenderPort } from 'src/core/application/utilities/ports/email-sender.port';
import { CACHE_PORT, EMAIL_SENDER } from 'src/core/application/utilities/utility.tokens';
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
import {
  RECURSO_STATUS_OPCOES,
  RESULTADO_FASE_OPCOES,
  UpdateAdminResultadoRecursoDto,
} from './dto/update-admin-resultado-recurso.dto';
import { CadastroGeralSyncService } from '../cadastro-geral/cadastro-geral-sync.service';

type EtapaEditalLike = {
  etapa?: string;
  tipo_etapa?: string;
  data_inicio?: Date | string;
  data_fim?: Date | string;
};

function normalizeText(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function toDateStart(value: unknown): Date | null {
  const s = String(value ?? '').trim();
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) {
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, 0, 0, 0);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

function toDateEnd(value: unknown): Date | null {
  const s = String(value ?? '').trim();
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) {
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 23, 59, 59, 999);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(23, 59, 59, 999);
  return d;
}

function isNowWithinEtapa(etapa: EtapaEditalLike, now = new Date()): boolean {
  const ini = toDateStart(etapa.data_inicio);
  const fim = toDateEnd(etapa.data_fim);
  if (!ini || !fim) return false;
  return now.getTime() >= ini.getTime() && now.getTime() <= fim.getTime();
}

function etapaTipoMatches(etapa: EtapaEditalLike, expectedTipos: string[]): boolean {
  const tipo = normalizeText(etapa.tipo_etapa);
  if (!tipo) return false;
  const expected = expectedTipos.map((t) => normalizeText(t));
  return expected.some((x) => tipo === x || tipo.includes(x));
}

function findEtapaInscricao(etapas: unknown): EtapaEditalLike | null {
  if (!Array.isArray(etapas)) return null;
  for (const item of etapas) {
    if (!item || typeof item !== 'object') continue;
    const etapa = item as EtapaEditalLike;
    if (etapaTipoMatches(etapa, ['INSCRICAO'])) return etapa;
  }
  for (const item of etapas) {
    if (!item || typeof item !== 'object') continue;
    const etapa = item as EtapaEditalLike;
    const nome = normalizeText(etapa.etapa);
    if (
      nome.includes('inscricao') ||
      nome.includes('solicitacao') ||
      nome.includes('submissao')
    ) {
      return etapa;
    }
  }
  return null;
}

function isInscricaoDisponivel(edital: Edital): boolean {
  const etapaInscricao = findEtapaInscricao(edital.etapa_edital);
  const dentroDaJanela = etapaInscricao ? isNowWithinEtapa(etapaInscricao) : false;
  return edital.inscricoes_abertas === true || dentroDaJanela;
}

@Injectable()
export class InscricaoService {
  private readonly allowedResultadoFaseTransitions: Record<
    (typeof RESULTADO_FASE_OPCOES)[number],
    (typeof RESULTADO_FASE_OPCOES)[number][]
  > = {
    'Nao publicado': ['Nao publicado', 'Resultado preliminar'],
    'Resultado preliminar': [
      'Resultado preliminar',
      'Resultado final',
      'Nao publicado',
    ],
    'Resultado final': ['Resultado final', 'Resultado preliminar'],
  };

  private readonly allowedRecursoStatusTransitions: Record<
    (typeof RECURSO_STATUS_OPCOES)[number],
    (typeof RECURSO_STATUS_OPCOES)[number][]
  > = {
    'Sem recurso': ['Sem recurso', 'Recurso solicitado'],
    'Recurso solicitado': ['Recurso solicitado', 'Recurso deferido', 'Recurso indeferido'],
    'Recurso deferido': ['Recurso deferido', 'Sem recurso'],
    'Recurso indeferido': ['Recurso indeferido', 'Sem recurso'],
  };

  private readonly allowedStatusInscricaoTransitions: Record<
    StatusInscricao,
    StatusInscricao[]
  > = {
    [StatusInscricao.PENDENTE]: [
      StatusInscricao.PENDENTE,
      StatusInscricao.EM_AJUSTE,
      StatusInscricao.APROVADA,
      StatusInscricao.NEGADA,
    ],
    [StatusInscricao.EM_AJUSTE]: [
      StatusInscricao.EM_AJUSTE,
      StatusInscricao.PENDENTE,
      StatusInscricao.APROVADA,
      StatusInscricao.NEGADA,
    ],
    [StatusInscricao.APROVADA]: [
      StatusInscricao.APROVADA,
      StatusInscricao.EM_AJUSTE,
      StatusInscricao.PENDENTE,
    ],
    [StatusInscricao.NEGADA]: [
      StatusInscricao.NEGADA,
      StatusInscricao.EM_AJUSTE,
      StatusInscricao.PENDENTE,
    ],
  };

  private readonly allowedStatusBeneficioTransitions: Record<
    StatusBeneficioEdital,
    StatusBeneficioEdital[]
  > = {
    [StatusBeneficioEdital.PENDENTE_SELECAO]: [
      StatusBeneficioEdital.PENDENTE_SELECAO,
      StatusBeneficioEdital.BENEFICIARIO,
      StatusBeneficioEdital.NAO_BENEFICIARIO,
    ],
    [StatusBeneficioEdital.BENEFICIARIO]: [
      StatusBeneficioEdital.BENEFICIARIO,
      StatusBeneficioEdital.PENDENTE_SELECAO,
    ],
    [StatusBeneficioEdital.NAO_BENEFICIARIO]: [
      StatusBeneficioEdital.NAO_BENEFICIARIO,
      StatusBeneficioEdital.PENDENTE_SELECAO,
    ],
  };

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
    @Inject(EMAIL_SENDER)
    private readonly emailSender: EmailSenderPort,
    private readonly inscricaoAuditLog: InscricaoAuditLogService,
    private readonly cadastroGeralSync: CadastroGeralSyncService,
  ) {}

  private portalAlunoUrl(path = '/portal-aluno'): string {
    const base = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
    const suffix = path.startsWith('/') ? path : `/${path}`;
    return `${base}${suffix}`;
  }

  private async loadInscricaoEmailContext(inscricaoId: number) {
    return this.inscricaoRepository.findOne({
      where: { id: inscricaoId },
      relations: ['aluno', 'aluno.usuario', 'vagas', 'vagas.edital'],
    });
  }

  private async notifyInscricaoCriada(inscricaoId: number): Promise<void> {
    const inscricao = await this.loadInscricaoEmailContext(inscricaoId);
    const email = inscricao?.aluno?.usuario?.email;
    if (!inscricao || !email) return;
    const nome = inscricao.aluno?.usuario?.nome ?? null;
    const edital = inscricao.vagas?.edital;
    const titulo = edital?.titulo_edital ?? 'Edital';

    await this.emailSender.sendAlunoProcessNotification({
      email,
      nome,
      subject: `[PROAE] [Edital de Benefícios] [Inscrição recebida] ${titulo}`,
      title: 'Inscrição enviada com sucesso',
      message: `Edital: "${titulo}". Recebemos sua inscrição com sucesso. Acompanhe o sistema para pendências e atualizações.`,
      ctaUrl: this.portalAlunoUrl('/portal-aluno'),
      ctaLabel: 'Acessar portal do aluno',
    });
  }

  private async notifyStatusInscricao(inscricaoId: number, statusNovo: string): Promise<void> {
    const inscricao = await this.loadInscricaoEmailContext(inscricaoId);
    const email = inscricao?.aluno?.usuario?.email;
    if (!inscricao || !email) return;
    const nome = inscricao.aluno?.usuario?.nome ?? null;
    const edital = inscricao.vagas?.edital;
    const titulo = edital?.titulo_edital ?? 'Edital';

    const observacao = (inscricao.observacao_admin ?? '').trim();
    let subject = `[PROAE] [Edital de Benefícios] [Atualização da inscrição] ${titulo}`;
    let title = 'Atualização da inscrição';
    let message = `Edital: "${titulo}". Houve atualização no status da sua inscrição. Verifique os detalhes no portal.`;

    if (statusNovo === StatusInscricao.APROVADA) {
      subject = `[PROAE] [Edital de Benefícios] [Aprovado na análise] ${titulo}`;
      title = 'Inscrição aprovada na análise';
      message = `Edital: "${titulo}". Sua inscrição foi aprovada na análise.`;
    } else if (statusNovo === StatusInscricao.NEGADA) {
      subject = `[PROAE] [Edital de Benefícios] [Reprovado na análise] ${titulo}`;
      title = 'Inscrição reprovada';
      message = `Edital: "${titulo}". Sua inscrição foi reprovada na análise. Verifique observações no sistema.`;
    } else if (statusNovo === StatusInscricao.EM_AJUSTE) {
      subject = `[PROAE] [Edital de Benefícios] [Pendência] ${titulo}`;
      title = 'Pendência na sua inscrição';
      message = `Edital: "${titulo}". Sua inscrição está com pendências. Acesse o sistema para ver as correções solicitadas e prazos.`;
    }

    if (observacao) {
      message = `${message}\n\nObservação da análise: ${observacao}`;
    }

    await this.emailSender.sendAlunoProcessNotification({
      email,
      nome,
      subject,
      title,
      message,
      ctaUrl: this.portalAlunoUrl('/portal-aluno/pendencias'),
      ctaLabel: 'Ver pendências',
    });
  }

  private async notifyBeneficioStatus(inscricaoId: number, statusBeneficio: StatusBeneficioEdital): Promise<void> {
    const inscricao = await this.loadInscricaoEmailContext(inscricaoId);
    const email = inscricao?.aluno?.usuario?.email;
    if (!inscricao || !email) return;
    const nome = inscricao.aluno?.usuario?.nome ?? null;
    const titulo = inscricao.vagas?.edital?.titulo_edital ?? 'Edital';

    let subject = `[PROAE] [Edital de Benefícios] [Atualização de benefício] ${titulo}`;
    let title = 'Atualização do benefício';
    let message = `Edital: "${titulo}". Houve atualização da sua situação de benefício.`;

    if (statusBeneficio === StatusBeneficioEdital.BENEFICIARIO) {
      subject = `[PROAE] [Edital de Benefícios] [Beneficiário homologado] ${titulo}`;
      title = 'Homologação como beneficiário';
      message = `Edital: "${titulo}". Você foi homologado como beneficiário.`;
    } else if (statusBeneficio === StatusBeneficioEdital.NAO_BENEFICIARIO) {
      subject = `[PROAE] [Edital de Benefícios] [Não beneficiário] ${titulo}`;
      title = 'Resultado de benefício no edital';
      message = `Edital: "${titulo}". Você não foi homologado como beneficiário.`;
    }

    await this.emailSender.sendAlunoProcessNotification({
      email,
      nome,
      subject,
      title,
      message,
      ctaUrl: this.portalAlunoUrl('/portal-aluno'),
      ctaLabel: 'Abrir portal',
    });
  }

  private assertStatusInscricaoTransition(
    from: StatusInscricao,
    to: StatusInscricao,
  ) {
    const allowed = this.allowedStatusInscricaoTransitions[from] ?? [from];
    if (!allowed.includes(to)) {
      throw new BadRequestException(
        `Transição de status da inscrição não permitida: "${from}" -> "${to}".`,
      );
    }
  }

  private assertStatusBeneficioTransition(
    from: StatusBeneficioEdital,
    to: StatusBeneficioEdital,
  ) {
    const allowed = this.allowedStatusBeneficioTransitions[from] ?? [from];
    if (!allowed.includes(to)) {
      throw new BadRequestException(
        `Transição de benefício no edital não permitida: "${from}" -> "${to}".`,
      );
    }
  }

  private assertResultadoFaseTransition(
    from: (typeof RESULTADO_FASE_OPCOES)[number],
    to: (typeof RESULTADO_FASE_OPCOES)[number],
  ) {
    const allowed = this.allowedResultadoFaseTransitions[from] ?? [from];
    if (!allowed.includes(to)) {
      throw new BadRequestException(
        `Transição de fase de resultado não permitida: "${from}" -> "${to}".`,
      );
    }
  }

  private assertRecursoStatusTransition(
    from: (typeof RECURSO_STATUS_OPCOES)[number],
    to: (typeof RECURSO_STATUS_OPCOES)[number],
  ) {
    const allowed = this.allowedRecursoStatusTransitions[from] ?? [from];
    if (!allowed.includes(to)) {
      throw new BadRequestException(
        `Transição de status de recurso não permitida: "${from}" -> "${to}".`,
      );
    }
  }

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

      if (!isInscricaoDisponivel(vagaExists.edital)) {
        throw new BadRequestException(
          'As inscrições deste edital estão fechadas no momento.',
        );
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

      try {
        await this.notifyInscricaoCriada(result.id);
      } catch (emailErr) {
        console.warn('[inscricao] Falha ao enviar e-mail de inscrição criada:', (emailErr as Error).message);
      }

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

        if (!isInscricaoDisponivel(vagaExists.edital)) {
          throw new BadRequestException(
            'As inscrições deste edital estão fechadas no momento.',
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

    if (!isInscricaoDisponivel(vagaExists.edital)) {
      throw new BadRequestException(
        'As inscrições deste edital estão fechadas no momento.',
      );
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
   * [Admin] Atualiza status e observação sem checagem de dono da inscrição.
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
      relations: ['vagas', 'vagas.edital', 'aluno'],
    });
    if (!inscricao) {
      throw new NotFoundException('Inscrição não encontrada');
    }
    this.assertStatusInscricaoTransition(inscricao.status_inscricao, dto.status);

    if (
      dto.status !== StatusInscricao.APROVADA &&
      inscricao.status_beneficio_edital === StatusBeneficioEdital.BENEFICIARIO
    ) {
      throw new BadRequestException(
        'Para alterar a análise desta inscrição para um status diferente de "Inscrição Aprovada", primeiro retire a homologação do benefício no edital.',
      );
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

    try {
      await this.notifyStatusInscricao(inscricaoId, dto.status);
    } catch (emailErr) {
      console.warn('[inscricao] Falha ao enviar e-mail de status:', (emailErr as Error).message);
    }

    const editalCg = inscricao.vagas?.edital;
    if (editalCg?.is_cadastro_geral === true && inscricao.aluno) {
      await this.cadastroGeralSync.onAdminAtualizouInscricaoCg({
        alunoId: (inscricao.aluno as Aluno).aluno_id,
        edital: editalCg,
        statusInscricao: dto.status,
        marcarPcdCg: dto.marcar_pcd_cg,
      });
    }

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
    dto: UpdateAdminInscricaoBeneficioDto,
    actorUsuarioId?: string | null,
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

    const statusBeneficio = dto.status_beneficio_edital;
    this.assertStatusBeneficioTransition(
      inscricao.status_beneficio_edital,
      statusBeneficio,
    );

    if (statusBeneficio === StatusBeneficioEdital.BENEFICIARIO) {
      if (inscricao.status_inscricao !== StatusInscricao.APROVADA) {
        throw new BadRequestException(
          'Só é possível homologar como beneficiário no edital depois que a inscrição estiver aprovada na análise (status "Inscrição Aprovada").',
        );
      }

      const numeroVagas = Number(inscricao.vagas?.numero_vagas ?? 0);
      if (Number.isFinite(numeroVagas) && numeroVagas > 0) {
        const homologados = await this.inscricaoRepository.count({
          where: {
            vagas: { id: inscricao.vagas.id },
            status_beneficio_edital: StatusBeneficioEdital.BENEFICIARIO,
          },
        });
        const homologadosSemAtual = homologados - (inscricao.status_beneficio_edital === StatusBeneficioEdital.BENEFICIARIO ? 1 : 0);
        if (homologadosSemAtual >= numeroVagas) {
          const overrideSolicitado = dto.permitir_exceder_vagas === true;
          const justificativaOverride = dto.justificativa_override?.trim() ?? '';
          if (!overrideSolicitado) {
            throw new BadRequestException(
              `Limite de vagas atingido para este benefício (${numeroVagas}). Para homologar acima do limite, marque "permitir exceder vagas" e informe justificativa.`,
            );
          }
          if (!actorUsuarioId) {
            throw new BadRequestException(
              'Não foi possível identificar o usuário responsável pelo override de vagas.',
            );
          }
          if (justificativaOverride.length < 10) {
            throw new BadRequestException(
              'Informe uma justificativa de pelo menos 10 caracteres para exceder o limite de vagas.',
            );
          }
          inscricao.beneficio_override_vagas = true;
          inscricao.beneficio_override_justificativa = justificativaOverride;
          inscricao.beneficio_override_autorizado_por = actorUsuarioId;
          inscricao.beneficio_override_autorizado_em = new Date();
        } else {
          inscricao.beneficio_override_vagas = false;
          inscricao.beneficio_override_justificativa = null;
          inscricao.beneficio_override_autorizado_por = null;
          inscricao.beneficio_override_autorizado_em = null;
        }
      }
    } else {
      inscricao.beneficio_override_vagas = false;
      inscricao.beneficio_override_justificativa = null;
      inscricao.beneficio_override_autorizado_por = null;
      inscricao.beneficio_override_autorizado_em = null;
    }
    inscricao.status_beneficio_edital = statusBeneficio;
    const saved = await this.entityManager.transaction(async (tx) =>
      tx.save(inscricao),
    );

    try {
      await this.notifyBeneficioStatus(inscricaoId, statusBeneficio);
    } catch (emailErr) {
      console.warn('[inscricao] Falha ao enviar e-mail de benefício:', (emailErr as Error).message);
    }
    return {
      id: saved.id,
      status_beneficio_edital: saved.status_beneficio_edital,
    };
  }

  /**
   * [Admin] Atualiza trilha de resultado (preliminar/final) e recurso administrativo.
   */
  async adminUpdateResultadoRecurso(
    inscricaoId: number,
    dto: UpdateAdminResultadoRecursoDto,
    actorUsuarioId?: string | null,
  ): Promise<{
    id: number;
    resultado_fase: string;
    recurso_status: string;
    recurso_observacao?: string | null;
    resultado_publicado_em?: Date | null;
  }> {
    const inscricao = await this.inscricaoRepository.findOne({
      where: { id: inscricaoId },
      relations: ['vagas', 'vagas.edital'],
    });
    if (!inscricao) {
      throw new NotFoundException('Inscrição não encontrada');
    }
    const faseAtual =
      (inscricao.resultado_fase as (typeof RESULTADO_FASE_OPCOES)[number]) ??
      'Nao publicado';
    const recursoAtual =
      (inscricao.recurso_status as (typeof RECURSO_STATUS_OPCOES)[number]) ??
      'Sem recurso';

    this.assertResultadoFaseTransition(faseAtual, dto.resultado_fase);
    this.assertRecursoStatusTransition(recursoAtual, dto.recurso_status);

    if (
      dto.recurso_status === 'Recurso solicitado' &&
      dto.resultado_fase !== 'Resultado preliminar'
    ) {
      throw new BadRequestException(
        'Recurso solicitado só é permitido quando a fase do resultado estiver como preliminar.',
      );
    }
    if (
      dto.resultado_fase === 'Resultado final' &&
      dto.recurso_status === 'Recurso solicitado'
    ) {
      throw new BadRequestException(
        'Não é possível manter recurso solicitado em resultado final. Julgue o recurso antes de publicar o resultado final.',
      );
    }

    inscricao.resultado_fase = dto.resultado_fase;
    inscricao.recurso_status = dto.recurso_status;
    if (dto.recurso_observacao !== undefined) {
      inscricao.recurso_observacao = dto.recurso_observacao;
    }
    inscricao.resultado_publicado_em =
      dto.resultado_fase === 'Nao publicado' ? null : new Date();

    const saved = await this.entityManager.transaction(async (tx) =>
      tx.save(inscricao),
    );

    await this.inscricaoAuditLog.logStatusChange({
      inscricaoId,
      actorUsuarioId: actorUsuarioId ?? null,
      statusAnterior: `${faseAtual} | ${recursoAtual}`,
      statusNovo: `${saved.resultado_fase} | ${saved.recurso_status}`,
      observacao: saved.recurso_observacao ?? null,
    });

    return {
      id: saved.id,
      resultado_fase: saved.resultado_fase,
      recurso_status: saved.recurso_status,
      recurso_observacao: saved.recurso_observacao ?? null,
      resultado_publicado_em: saved.resultado_publicado_em ?? null,
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

  /**
   * Exporta inscrições de um edital em CSV (UTF-8 com BOM, separador `;`).
   * Cada linha = 1 inscrição. Colunas fixas + 1 coluna por pergunta do edital.
   * Aceitamos a planilha aberta diretamente em Excel-pt-BR sem precisar
   * gerar `.xlsx` (e sem dependência adicional).
   */
  async exportInscricoesEditalCsv(editalId: number): Promise<string> {
    const edital = await this.editalRepository.findOne({
      where: { id: editalId },
      relations: { steps: { perguntas: true } },
    });
    if (!edital) {
      throw new NotFoundException('Edital não encontrado');
    }

    // Colunas dinâmicas: ordena steps + perguntas por (ordem, id) para casar com o front.
    const stepsOrdenados = (edital.steps ?? [])
      .slice()
      .sort((a, b) => {
        const oa = (a.ordem ?? 0);
        const ob = (b.ordem ?? 0);
        return oa === ob ? a.id - b.id : oa - ob;
      });
    const colunasPerguntas: { id: number; cabec: string }[] = [];
    for (const step of stepsOrdenados) {
      const perguntasOrd = (step.perguntas ?? [])
        .slice()
        .sort((a, b) => {
          const oa = a.ordem ?? 0;
          const ob = b.ordem ?? 0;
          return oa === ob ? a.id - b.id : oa - ob;
        });
      for (const p of perguntasOrd) {
        colunasPerguntas.push({
          id: p.id,
          cabec: `${step.texto || 'Etapa'} :: ${p.pergunta}`,
        });
      }
    }

    const inscricoes = await this.inscricaoRepository.find({
      where: { vagas: { edital: { id: editalId } } },
      relations: {
        aluno: { usuario: true },
        vagas: true,
        respostas: { pergunta: true },
      },
      order: { id: 'ASC' },
    });

    const cabecalhos = [
      'id_inscricao',
      'data_inscricao',
      'status_inscricao',
      'situacao_beneficio',
      'pontuacao_validada',
      'pontuacao_maxima',
      'aluno_nome',
      'aluno_cpf',
      'aluno_email',
      'aluno_matricula',
      'aluno_curso',
      'aluno_campus',
      ...colunasPerguntas.map((c) => c.cabec),
    ];

    const linhas: string[] = [];
    linhas.push(cabecalhos.map(csvEscape).join(';'));

    for (const ins of inscricoes) {
      const pontuacao = calcularPontuacaoInscricao(ins);
      const respostasMap = new Map<number, Resposta>();
      for (const r of ins.respostas ?? []) {
        if (r.pergunta?.id != null) respostasMap.set(r.pergunta.id, r);
      }
      const linha: string[] = [
        String(ins.id),
        ins.data_inscricao
          ? new Date(ins.data_inscricao).toLocaleDateString('pt-BR')
          : '',
        String(ins.status_inscricao ?? ''),
        String(ins.status_beneficio_edital ?? ''),
        String(pontuacao.validada.toFixed(2)),
        String(pontuacao.maxima.toFixed(2)),
        ins.aluno?.usuario?.nome ?? '',
        ins.aluno?.usuario?.cpf ?? '',
        ins.aluno?.usuario?.email ?? '',
        ins.aluno?.matricula ?? '',
        ins.aluno?.curso ?? '',
        String(ins.aluno?.campus ?? ''),
      ];

      for (const col of colunasPerguntas) {
        const r = respostasMap.get(col.id);
        linha.push(formatRespostaParaCsv(r));
      }
      linhas.push(linha.map(csvEscape).join(';'));
    }

    // BOM UTF-8 para abrir corretamente no Excel-pt-BR.
    return '\uFEFF' + linhas.join('\r\n');
  }
}

function csvEscape(valor: string): string {
  if (valor == null) return '';
  const s = String(valor);
  if (/[";\r\n]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function formatRespostaParaCsv(resposta?: Resposta): string {
  if (!resposta) return '';
  if (resposta.urlArquivo) return resposta.urlArquivo;
  if (Array.isArray(resposta.valorOpcoes) && resposta.valorOpcoes.length) {
    return resposta.valorOpcoes.join(' | ');
  }
  if (resposta.valorTexto != null && resposta.valorTexto !== '') {
    return resposta.valorTexto;
  }
  if (resposta.texto != null && resposta.texto !== '') {
    return resposta.texto;
  }
  return '';
}

function calcularPontuacaoInscricao(
  inscricao: Inscricao,
): { validada: number; maxima: number } {
  const respostas = inscricao.respostas ?? [];
  let validada = 0;
  let maxima = 0;
  for (const r of respostas) {
    const peso = Number((r.pergunta as any)?.pontuacao_validacao ?? 0);
    if (!Number.isFinite(peso) || peso <= 0) continue;
    maxima += peso;
    if (r.validada === true) validada += peso;
  }
  return {
    validada: Math.round(validada * 100) / 100,
    maxima: Math.round(maxima * 100) / 100,
  };
}
