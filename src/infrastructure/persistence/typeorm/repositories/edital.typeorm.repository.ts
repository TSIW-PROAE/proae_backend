import { Injectable } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { Brackets, EntityManager, In, Repository } from 'typeorm';
import { Edital } from '../entities/edital/edital.entity';
import { Inscricao } from '../entities/inscricao/inscricao.entity';
import { Pergunta } from '../entities/pergunta/pergunta.entity';
import { Vagas } from '../entities/vagas/vagas.entity';
import { Step } from '../entities/step/step.entity';
import { StatusEdital } from '../../../../core/shared-kernel/enums/enumStatusEdital';
import { StatusBeneficioEdital } from '../../../../core/shared-kernel/enums/enumStatusBeneficioEdital';
import { StatusInscricao } from '../../../../core/shared-kernel/enums/enumStatusInscricao';
import { NivelAcademico } from '../../../../core/shared-kernel/enums/enumNivelAcademico';
import type {
  AlunoInscritoData,
  AlunosInscritosListData,
} from '../../../../core/domain/edital/ports/edital.repository.port';
import type {
  EditalData,
  CreateEditalData,
  UpdateEditalData,
  StatusEditalDomain,
} from '../../../../core/domain/edital/edital.types';
import type { IEditalRepository } from '../../../../core/domain/edital/ports/edital.repository.port';

const STATUS_TO_ENUM: Record<StatusEditalDomain, StatusEdital> = {
  RASCUNHO: StatusEdital.RASCUNHO,
  ABERTO: StatusEdital.ABERTO,
  ENCERRADO: StatusEdital.ENCERRADO,
  EM_ANDAMENTO: StatusEdital.EM_ANDAMENTO,
};

const ENUM_TO_STATUS: Record<StatusEdital, StatusEditalDomain> = {
  [StatusEdital.RASCUNHO]: 'RASCUNHO',
  [StatusEdital.ABERTO]: 'ABERTO',
  [StatusEdital.ENCERRADO]: 'ENCERRADO',
  [StatusEdital.EM_ANDAMENTO]: 'EM_ANDAMENTO',
};

@Injectable()
export class EditalTypeOrmRepository implements IEditalRepository {
  constructor(
    @InjectRepository(Edital)
    private readonly editalRepository: Repository<Edital>,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async create(data: CreateEditalData): Promise<EditalData> {
    const nivel =
      (data.nivel_academico as NivelAcademico) ?? NivelAcademico.GRADUACAO;

    const isCg = data.is_cadastro_geral === true;
    const isRenovacao = !isCg && data.is_formulario_renovacao === true;

    if (isCg && data.is_formulario_renovacao === true) {
      throw new Error(
        'Um edital não pode ser Cadastro Geral e renovação ao mesmo tempo.',
      );
    }

    const edital = new Edital({
      titulo_edital: data.titulo_edital,
      status_edital: StatusEdital.RASCUNHO,
      inscricoes_abertas: data.inscricoes_abertas ?? false,
      ajustes_abertos: data.ajustes_abertos ?? false,
      descricao: undefined,
      edital_url: undefined,
      etapa_edital: undefined,
      nivel_academico: nivel,
      is_formulario_renovacao: isRenovacao,
      is_cadastro_geral: isCg,
    });
    const saved = await this.editalRepository.save(edital);

    if (isCg) {
      await this.entityManager.save(
        new Vagas({
          beneficio: 'Cadastro Geral',
          descricao_beneficio:
            'Solicitação de comprovação de vulnerabilidade socioeconômica (CG PROAE).',
          numero_vagas: 9999,
          edital: saved,
        }),
      );
    }

    const aplicarTemplate =
      data.aplicar_template_cadastro === true || isCg;
    if (aplicarTemplate) {
      await this.aplicarTemplateCadastro(saved.id, nivel);
    }

    return this.toEditalData(saved);
  }

  private async aplicarTemplateCadastro(
    editalAlvoId: number,
    nivel: NivelAcademico,
  ): Promise<void> {
    const source = await this.editalRepository.findOne({
      where: { is_template_cadastro_base: true, nivel_academico: nivel },
      relations: ['steps', 'steps.perguntas', 'steps.perguntas.dado'],
    });

    const stepsOrigem = source?.steps ?? [];
    if (!stepsOrigem.length) return;

    const mapaPerguntasOrigemAlvo = new Map<number, number>();

    await this.entityManager.transaction(async (tx) => {
      const stepsOrdenados = stepsOrigem
        .slice()
        .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0) || a.id - b.id);

      const grupos: { perguntasOrigem: Pergunta[] }[] = [];

      for (const stepOrig of stepsOrdenados) {
        const novoStep = tx.create(Step, {
          texto: stepOrig.texto,
          ordem: stepOrig.ordem ?? 0,
          edital: { id: editalAlvoId } as Edital,
        });
        const stepSalvo = await tx.save(novoStep);

        const perguntasOrdenadas = (stepOrig.perguntas ?? [])
          .slice()
          .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0) || a.id - b.id);

        for (const pOrig of perguntasOrdenadas) {
          const novaPergunta = tx.create(Pergunta, {
            tipo_Pergunta: pOrig.tipo_Pergunta,
            pergunta: pOrig.pergunta,
            obrigatoriedade: pOrig.obrigatoriedade,
            opcoes: pOrig.opcoes ?? [],
            tipo_formatacao: pOrig.tipo_formatacao ?? undefined,
            ordem: pOrig.ordem ?? 0,
            pontuacao_validacao: Number(
              (pOrig as unknown as { pontuacao_validacao?: number })
                .pontuacao_validacao ?? 0,
            ),
            condicao: null,
            step: stepSalvo,
            dado: pOrig.dado ? ({ id: pOrig.dado.id } as Pergunta['dado']) : undefined,
          });
          const perguntaSalva = await tx.save(novaPergunta);
          mapaPerguntasOrigemAlvo.set(pOrig.id, perguntaSalva.id);
        }

        grupos.push({ perguntasOrigem: perguntasOrdenadas });
      }

      for (const grupo of grupos) {
        for (const pOrig of grupo.perguntasOrigem) {
          if (!pOrig.condicao) continue;
          const novoIdOrigem = mapaPerguntasOrigemAlvo.get(
            pOrig.condicao.pergunta_id_origem,
          );
          if (!novoIdOrigem) continue;
          const novoIdPergunta = mapaPerguntasOrigemAlvo.get(pOrig.id);
          if (!novoIdPergunta) continue;
          await tx.update(Pergunta, novoIdPergunta, {
            condicao: {
              pergunta_id_origem: novoIdOrigem,
              operador: pOrig.condicao.operador,
              valor: pOrig.condicao.valor,
            },
          });
        }
      }
    });
  }

  async findAll(nivelAcademico?: string): Promise<EditalData[]> {
    const list = await this.editalRepository.find({
      where: {
        ...(nivelAcademico
          ? { nivel_academico: nivelAcademico as NivelAcademico }
          : {}),
      },
    });
    return list.map((e) => this.toEditalData(e));
  }

  async findOne(id: number): Promise<EditalData | null> {
    const edital = await this.editalRepository.findOne({ where: { id } });
    return edital ? this.toEditalData(edital) : null;
  }

  async update(id: number, data: UpdateEditalData): Promise<EditalData> {
    const edital = await this.editalRepository.findOneBy({ id });
    if (!edital) throw new Error('Edital não encontrado');

    await this.entityManager.transaction(async (tx) => {
      Object.assign(edital, {
        titulo_edital: data.titulo_edital ?? edital.titulo_edital,
        descricao: data.descricao ?? edital.descricao,
        edital_url: data.edital_url ?? edital.edital_url,
        etapa_edital: data.etapa_edital ?? edital.etapa_edital,
        ...(data.nivel_academico != null
          ? { nivel_academico: data.nivel_academico as NivelAcademico }
          : {}),
        ...(data.is_formulario_renovacao != null
          ? { is_formulario_renovacao: data.is_formulario_renovacao }
          : {}),
        ...(data.is_cadastro_geral != null
          ? { is_cadastro_geral: data.is_cadastro_geral }
          : {}),
        ...(data.inscricoes_abertas != null
          ? { inscricoes_abertas: data.inscricoes_abertas }
          : {}),
        ...(data.ajustes_abertos != null
          ? { ajustes_abertos: data.ajustes_abertos }
          : {}),
        // `data_fim_vigencia` é tri-estado: ausente → preserva, null → limpa,
        // valor → atualiza. O controller só inclui a chave quando ela veio
        // no body do PATCH, então `hasOwnProperty` distingue "ausente" de
        // "ausente porque é null".
        ...(Object.prototype.hasOwnProperty.call(data, 'data_fim_vigencia')
          ? {
              data_fim_vigencia: this.parseDataFimVigencia(
                data.data_fim_vigencia,
              ),
            }
          : {}),
      });
      await tx.save(edital);
    });

    const updated = await this.editalRepository.findOneBy({ id });
    return this.toEditalData(updated!);
  }

  /**
   * Converte o input do controller (`Date | string YYYY-MM-DD | null`) no
   * tipo aceito pela coluna `date` do TypeORM (`Date | null`). Strings
   * inválidas viram `null` (semântica de "limpar") em vez de causar
   * erro silencioso de persistência.
   */
  private parseDataFimVigencia(
    value: Date | string | null | undefined,
  ): Date | null {
    if (value === null || value === undefined || value === '') return null;
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }
    const s = String(value).trim();
    if (!s) return null;
    // Aceita `YYYY-MM-DD` (formato canônico do front) e ISO completo.
    const m = /^(\d{4}-\d{2}-\d{2})/.exec(s);
    if (!m) {
      const fallback = new Date(s);
      return Number.isNaN(fallback.getTime()) ? null : fallback;
    }
    // Constrói à meia-noite UTC para evitar deslocamentos de timezone que
    // poderiam fazer "2026-05-10" virar "2026-05-09" em ambientes BRT.
    const d = new Date(`${m[1]}T00:00:00.000Z`);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  async remove(id: number): Promise<void> {
    const edital = await this.editalRepository.findOne({
      where: { id },
      relations: ['vagas', 'vagas.inscricoes', 'steps', 'steps.perguntas'],
    });
    if (!edital) throw new Error('Edital não encontrado');

    if (edital.vagas?.some((v) => v.inscricoes?.length)) {
      throw new Error(
        'Não é possível excluir o edital pois existem inscrições vinculadas às vagas',
      );
    }

    await this.entityManager.transaction(async (tx) => {
      if (edital.vagas?.length) await tx.remove(edital.vagas);

      if (edital.steps?.length) {
        const perguntas = edital.steps.flatMap((step) => step.perguntas ?? []);
        if (perguntas.length) await tx.remove(perguntas);
        await tx.remove(edital.steps);
      }

      await tx.remove(edital);
    });
  }

  async findOpened(nivelAcademico?: string): Promise<EditalData[]> {
    return this.findEditaisPorStatusList(
      [StatusEdital.ABERTO],
      nivelAcademico,
    );
  }

  /**
   * Editais visíveis no portal do aluno: ABERTO + EM_ANDAMENTO + ENCERRADO.
   * (RASCUNHO segue oculto pois ainda não foi publicado.)
   * O backend continua impedindo inscrições fora do status ABERTO
   * (ver inscricao.service / inscricao.repository).
   */
  async findVisiveisParaAluno(
    nivelAcademico?: string,
  ): Promise<EditalData[]> {
    return this.findEditaisPorStatusList(
      [StatusEdital.ABERTO, StatusEdital.EM_ANDAMENTO, StatusEdital.ENCERRADO],
      nivelAcademico,
    );
  }

  /**
   * Implementação compartilhada para listas filtradas por um conjunto de
   * status. Mantém o cálculo de
   * `quantidade_bolsas` e `numero_beneficios` derivado das vagas.
   */
  private async findEditaisPorStatusList(
    statusList: StatusEdital[],
    nivelAcademico?: string,
  ): Promise<EditalData[]> {
    const nivel =
      nivelAcademico != null && nivelAcademico !== ''
        ? (nivelAcademico as NivelAcademico)
        : NivelAcademico.GRADUACAO;
    const list = await this.editalRepository.find({
      where: {
        status_edital: In(statusList),
        nivel_academico: nivel,
        is_template_cadastro_base: false,
      },
      relations: ['vagas'],
      order: {
        // Edital não expõe `updated_at` na entidade TypeORM; `id` DESC
        // tende a listar os cadastros mais recentes primeiro.
        id: 'DESC',
      },
    });
    return list.map((e) => {
      const base = this.toEditalData(e);
      const vagas = e.vagas ?? [];
      const quantidadeBolsas = vagas.reduce(
        (acc, v) => acc + (Number(v.numero_vagas) || 0),
        0,
      );
      return {
        ...base,
        quantidade_bolsas: quantidadeBolsas,
        numero_beneficios: vagas.length,
      };
    });
  }

  async updateStatus(
    id: number,
    status: StatusEditalDomain,
  ): Promise<EditalData> {
    const edital = await this.editalRepository.findOneBy({ id });
    if (!edital) throw new Error('Edital não encontrado');
    const enumStatus = STATUS_TO_ENUM[status];
    await this.entityManager.transaction(async (tx) => {
      edital.status_edital = enumStatus;
      await tx.save(edital);
    });
    const updated = await this.editalRepository.findOneBy({ id });
    return this.toEditalData(updated!);
  }

  async getAlunosInscritos(
    editalId: number,
    opts: {
      page: number;
      limit: number;
      busca?: string;
      status?: string;
      situacao_solicitacao?: string;
      ordenacao?: string;
    },
  ): Promise<AlunosInscritosListData> {
    const page =
      Number.isFinite(opts.page) && Number(opts.page) > 0
        ? Math.floor(Number(opts.page))
        : 1;
    const limit =
      Number.isFinite(opts.limit) && Number(opts.limit) > 0
        ? Math.min(Math.floor(Number(opts.limit)), 100)
        : 20;
    const skip = (page - 1) * limit;
    const busca = opts.busca?.trim().toLowerCase();
    const statusFiltro = this.parseStatusInscricaoFiltro(opts.status);
    const situacaoFiltro = this.parseSituacaoSolicitacaoFiltro(
      opts.situacao_solicitacao,
    );
    const ordenacao = this.normalizeOrdenacaoInscricoes(opts.ordenacao);

    const qb = this.entityManager
      .createQueryBuilder(Inscricao, 'inscricao')
      .innerJoinAndSelect('inscricao.aluno', 'aluno')
      .innerJoinAndSelect('aluno.usuario', 'usuario')
      .innerJoinAndSelect('inscricao.vagas', 'vaga')
      .innerJoin('vaga.edital', 'edital')
      .leftJoinAndSelect('inscricao.respostas', 'resposta')
      .leftJoinAndSelect('resposta.pergunta', 'pergunta')
      .where('edital.id = :editalId', { editalId });

    if (statusFiltro) {
      qb.andWhere('inscricao.status_inscricao = :statusFiltro', { statusFiltro });
    }

    if (situacaoFiltro) {
      if (situacaoFiltro === 'DESISTENTE') {
        qb.andWhere('LOWER(COALESCE(inscricao.observacao_admin, \'\')) LIKE :desist', {
          desist: '%desist%',
        });
      } else if (situacaoFiltro === 'INDEFERIDA') {
        qb.andWhere('inscricao.status_inscricao = :negada', {
          negada: StatusInscricao.NEGADA,
        }).andWhere(
          'LOWER(COALESCE(inscricao.observacao_admin, \'\')) NOT LIKE :desist',
          { desist: '%desist%' },
        );
      } else if (situacaoFiltro === 'SELECIONADA') {
        qb.andWhere('inscricao.status_inscricao = :aprovada', {
          aprovada: StatusInscricao.APROVADA,
        })
          .andWhere('inscricao.status_beneficio_edital = :benef', {
            benef: StatusBeneficioEdital.BENEFICIARIO,
          })
          .andWhere(
            'LOWER(COALESCE(inscricao.observacao_admin, \'\')) NOT LIKE :desist',
            { desist: '%desist%' },
          );
      } else if (situacaoFiltro === 'CLASSIFICADA') {
        qb.andWhere(
          new Brackets((subQb) => {
            subQb
              .where('LOWER(COALESCE(inscricao.observacao_admin, \'\')) NOT LIKE :desist', {
                desist: '%desist%',
              })
              .andWhere('inscricao.status_inscricao <> :negada', {
                negada: StatusInscricao.NEGADA,
              })
              .andWhere(
                new Brackets((inner) => {
                  inner
                    .where('inscricao.status_inscricao <> :aprovada', {
                      aprovada: StatusInscricao.APROVADA,
                    })
                    .orWhere('inscricao.status_beneficio_edital <> :benef', {
                      benef: StatusBeneficioEdital.BENEFICIARIO,
                    });
                }),
              );
          }),
        );
      }
    }

    if (busca) {
      qb.andWhere(
        new Brackets((subQb) => {
          subQb
            .where('LOWER(usuario.nome) LIKE :busca', { busca: `%${busca}%` })
            .orWhere('LOWER(usuario.email) LIKE :busca', {
              busca: `%${busca}%`,
            })
            .orWhere('LOWER(usuario.cpf) LIKE :busca', { busca: `%${busca}%` })
            .orWhere('LOWER(aluno.matricula) LIKE :busca', {
              busca: `%${busca}%`,
            });
        }),
      );
    }

    if (ordenacao === 'data_asc') {
      qb.orderBy('inscricao.data_inscricao', 'ASC').addOrderBy(
        'inscricao.id',
        'ASC',
      );
    } else {
      qb.orderBy('inscricao.data_inscricao', 'DESC').addOrderBy(
        'inscricao.id',
        'DESC',
      );
    }

    const total = await qb
      .clone()
      .select('inscricao.id')
      .distinct(true)
      .getCount();

    const inscricoes = await qb
      .clone()
      .distinct(true)
      .skip(skip)
      .take(limit)
      .getMany();

    const fmtDate = (d: Date | string | null | undefined): string | null => {
      if (d == null) return null;
      if (typeof d === 'string') return d;
      if (d instanceof Date) return d.toISOString().slice(0, 10);
      return String(d);
    };

    const dados = inscricoes.map((insc) => {
      const aluno = insc.aluno;
      const u = aluno.usuario!;
      const di = insc.data_inscricao;
      const dataInsc =
        di instanceof Date
          ? di.toISOString()
          : typeof di === 'string'
            ? di
            : String(di);

      const vaga = insc.vagas;
      const respostas = insc.respostas ?? [];
      const pontuacaoValidada = respostas.reduce((acc, r) => {
        if (r.validada !== true) return acc;
        const peso = Number((r.pergunta as any)?.pontuacao_validacao ?? 0);
        return acc + (Number.isFinite(peso) && peso > 0 ? peso : 0);
      }, 0);
      const pontuacaoMaxima = respostas.reduce((acc, r) => {
        const peso = Number((r.pergunta as any)?.pontuacao_validacao ?? 0);
        return acc + (Number.isFinite(peso) && peso > 0 ? peso : 0);
      }, 0);
      return {
        inscricao_id: insc.id,
        status_inscricao: String(insc.status_inscricao),
        situacao_solicitacao: this.classifySituacaoSolicitacao({
          status_inscricao: String(insc.status_inscricao),
          status_beneficio_edital: String(insc.status_beneficio_edital),
          observacao_admin: insc.observacao_admin ?? null,
        }),
        status_beneficio_edital: String(insc.status_beneficio_edital),
        resultado_fase: String((insc as any).resultado_fase ?? 'Nao publicado'),
        recurso_status: String((insc as any).recurso_status ?? 'Sem recurso'),
        recurso_observacao: (insc as any).recurso_observacao ?? null,
        resultado_publicado_em: (insc as any).resultado_publicado_em
          ? new Date((insc as any).resultado_publicado_em).toISOString()
          : null,
        beneficio_nome: vaga?.beneficio ?? null,
        data_inscricao: dataInsc,
        aluno_id: aluno.aluno_id,
        usuario_id: u.usuario_id,
        email: u.email,
        nome: u.nome,
        cpf: u.cpf,
        celular: u.celular,
        data_nascimento: fmtDate(u.data_nascimento),
        matricula: aluno.matricula,
        curso: aluno.curso,
        campus: String(aluno.campus),
        data_ingresso: aluno.data_ingresso,
        pontuacao_validada: Math.round(pontuacaoValidada * 100) / 100,
        pontuacao_maxima: Math.round(pontuacaoMaxima * 100) / 100,
      };
    });

    if (ordenacao === 'pontuacao_asc' || ordenacao === 'pontuacao_desc') {
      dados.sort((a, b) => {
        const pa = Number(a.pontuacao_validada ?? 0);
        const pb = Number(b.pontuacao_validada ?? 0);
        if (ordenacao === 'pontuacao_asc') {
          if (pa !== pb) return pa - pb;
          return (
            new Date(a.data_inscricao).getTime() -
            new Date(b.data_inscricao).getTime()
          );
        }
        if (pb !== pa) return pb - pa;
        return (
          new Date(b.data_inscricao).getTime() -
          new Date(a.data_inscricao).getTime()
        );
      });
    }

    return {
      dados,
      paginacao: this.buildPaginationMeta(total, page, limit),
    };
  }

  private normalizeOrdenacaoInscricoes(
    raw?: string,
  ): 'data_desc' | 'data_asc' | 'pontuacao_desc' | 'pontuacao_asc' {
    const value = String(raw ?? '').trim().toLowerCase();
    if (value === 'data_asc') return 'data_asc';
    if (value === 'pontuacao_asc') return 'pontuacao_asc';
    if (value === 'pontuacao_desc') return 'pontuacao_desc';
    return 'data_desc';
  }

  private parseStatusInscricaoFiltro(raw?: string): StatusInscricao | null {
    if (!raw) return null;
    const normalized = String(raw)
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/\s+/g, '_');

    switch (normalized) {
      case 'PENDENTE':
      case 'EM_ANALISE':
      case 'INSCRICAO_PENDENTE':
        return StatusInscricao.PENDENTE;
      case 'APROVADA':
      case 'APROVADO':
      case 'INSCRICAO_APROVADA':
        return StatusInscricao.APROVADA;
      case 'NEGADA':
      case 'REJEITADA':
      case 'REPROVADA':
      case 'REPROVADO':
      case 'INSCRICAO_NEGADA':
        return StatusInscricao.NEGADA;
      case 'AJUSTE_NECESSARIO':
      case 'EM_AJUSTE':
      case 'AGUARDANDO_COMPLEMENTO':
      case 'PENDENTE_REGULARIZACAO':
      case 'REJEITADA_POR_PRAZO_COMPLEMENTO':
        return StatusInscricao.EM_AJUSTE;
      default:
        return null;
    }
  }

  private parseSituacaoSolicitacaoFiltro(
    raw?: string,
  ): 'SELECIONADA' | 'CLASSIFICADA' | 'INDEFERIDA' | 'DESISTENTE' | null {
    const value = String(raw ?? '').trim().toUpperCase();
    if (
      value === 'SELECIONADA' ||
      value === 'CLASSIFICADA' ||
      value === 'INDEFERIDA' ||
      value === 'DESISTENTE'
    ) {
      return value;
    }
    return null;
  }

  private buildPaginationMeta(totalItems: number, page: number, limit: number) {
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    return {
      pagina: page,
      limite: limit,
      total_itens: totalItems,
      total_paginas: totalPages,
      tem_anterior: page > 1,
      tem_proxima: page < totalPages,
    };
  }

  private classifySituacaoSolicitacao(insc: {
    status_inscricao?: string | null;
    status_beneficio_edital?: string | null;
    observacao_admin?: string | null;
  }): string {
    const obs = String(insc.observacao_admin ?? '').toLowerCase();
    if (obs.includes('desist')) return 'DESISTENTE';

    const statusInscricao = String(insc.status_inscricao ?? '');
    if (statusInscricao === StatusInscricao.NEGADA) return 'INDEFERIDA';

    const statusBeneficio = String(insc.status_beneficio_edital ?? '');
    if (
      statusInscricao === StatusInscricao.APROVADA &&
      statusBeneficio === StatusBeneficioEdital.BENEFICIARIO
    ) {
      return 'SELECIONADA';
    }

    return 'CLASSIFICADA';
  }

  private toEditalData(e: Edital): EditalData {
    return {
      id: e.id,
      titulo_edital: e.titulo_edital,
      descricao: e.descricao,
      edital_url: e.edital_url as EditalData['edital_url'],
      status_edital: ENUM_TO_STATUS[e.status_edital!],
      inscricoes_abertas: e.inscricoes_abertas ?? false,
      ajustes_abertos: e.ajustes_abertos ?? false,
      is_formulario_renovacao: e.is_formulario_renovacao ?? false,
      is_cadastro_geral: e.is_cadastro_geral ?? false,
      etapa_edital: e.etapa_edital as EditalData['etapa_edital'],
      nivel_academico: e.nivel_academico ?? NivelAcademico.GRADUACAO,
      data_fim_vigencia: e.data_fim_vigencia ?? null,
      created_at: (e as unknown as { created_at?: Date }).created_at,
      updated_at: (e as unknown as { updated_at?: Date }).updated_at,
    };
  }
}
