import { Inject, Injectable } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { Brackets, EntityManager, In, Repository } from 'typeorm';
import { Inscricao } from '../entities/inscricao/inscricao.entity';
import { Aluno } from '../entities/aluno/aluno.entity';
import { Usuario } from '../entities/usuarios/usuario.entity';
import { Vagas } from '../entities/vagas/vagas.entity';
import { Edital } from '../entities/edital/edital.entity';
import { Pergunta } from '../entities/pergunta/pergunta.entity';
import { Resposta } from '../entities/resposta/resposta.entity';
import { StatusDocumento } from '../../../../core/shared-kernel/enums/statusDocumento';
import { StatusInscricao } from '../../../../core/shared-kernel/enums/enumStatusInscricao';
import { StatusBeneficioEdital } from '../../../../core/shared-kernel/enums/enumStatusBeneficioEdital';
import type {
  InscricaoComPendenciasItem,
  CreateInscricaoCommand,
  CorrigirRespostasInscricaoCommand,
  UpdateInscricaoCommand,
  InscricaoData,
} from '../../../../core/domain/inscricao/inscricao.types';
import type { IInscricaoRepository } from '../../../../core/domain/inscricao/ports/inscricao.repository.port';
import type { CachePort } from '../../../../core/application/utilities/ports/cache.port';
import { CACHE_PORT } from '../../../../core/application/utilities/utility.tokens';
import {
  inscricaoTemRespostaPrecisandoAjuste,
  respostaPrecisaAjuste,
} from '../../../../core/domain/resposta/resposta-ajuste.policy';

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

function toDateOnlyStart(value: unknown): Date | null {
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

function toDateOnlyEnd(value: unknown): Date | null {
  const s = String(value ?? '').trim();
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) {
    const d = new Date(
      Number(m[1]),
      Number(m[2]) - 1,
      Number(m[3]),
      23,
      59,
      59,
      999,
    );
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(23, 59, 59, 999);
  return d;
}

function isNowInsideEtapa(etapa: EtapaEditalLike, now = new Date()): boolean {
  const ini = toDateOnlyStart(etapa.data_inicio);
  const fim = toDateOnlyEnd(etapa.data_fim);
  if (!ini || !fim) return false;
  return now.getTime() >= ini.getTime() && now.getTime() <= fim.getTime();
}

function etapaTipoMatches(
  etapa: EtapaEditalLike,
  expectedTipos: string[],
): boolean {
  const tipo = normalizeText(etapa.tipo_etapa);
  if (!tipo) return false;
  const normalizedExpected = expectedTipos.map((t) => normalizeText(t));
  return normalizedExpected.some((et) => tipo === et || tipo.includes(et));
}

function findEtapaByTipoOrKeywords(
  etapas: unknown,
  opts: { tipos?: string[]; keywords?: string[] },
): EtapaEditalLike | null {
  if (!Array.isArray(etapas) || etapas.length === 0) return null;
  const normalizedKeywords = (opts.keywords ?? [])
    .map((k) => normalizeText(k))
    .filter(Boolean);
  const tipos = opts.tipos ?? [];

  for (const item of etapas) {
    if (!item || typeof item !== 'object') continue;
    const etapa = item as EtapaEditalLike;
    if (tipos.length > 0 && etapaTipoMatches(etapa, tipos)) {
      return etapa;
    }
  }

  for (const item of etapas) {
    if (!item || typeof item !== 'object') continue;
    const etapa = item as EtapaEditalLike;
    const nome = normalizeText(etapa.etapa);
    if (!nome) continue;
    if (normalizedKeywords.some((k) => nome.includes(k))) return etapa;
  }
  return null;
}

function findEtapaInscricao(etapas: unknown): EtapaEditalLike | null {
  return findEtapaByTipoOrKeywords(etapas, {
    tipos: ['INSCRICAO'],
    keywords: ['inscricao', 'solicitacao', 'submissao'],
  });
}

function findEtapaAjustes(etapas: unknown): EtapaEditalLike | null {
  return findEtapaByTipoOrKeywords(etapas, {
    tipos: ['AJUSTES', 'COMPLEMENTACAO'],
    keywords: ['ajuste', 'complemento', 'correcao', 'pendencia'],
  });
}

function isInscricaoDisponivel(edital: Edital): boolean {
  const etapaInscricao = findEtapaInscricao(edital.etapa_edital);
  const dentroDaJanela = etapaInscricao ? isNowInsideEtapa(etapaInscricao) : false;
  return edital.inscricoes_abertas === true || dentroDaJanela;
}

function isAjusteDisponivel(edital: Edital): boolean {
  const etapaAjustes = findEtapaAjustes(edital.etapa_edital);
  const etapaFallbackInscricao = etapaAjustes
    ? null
    : findEtapaInscricao(edital.etapa_edital);
  const etapaBase = etapaAjustes ?? etapaFallbackInscricao;
  const dentroDaJanela = etapaBase ? isNowInsideEtapa(etapaBase) : false;
  return edital.ajustes_abertos === true || dentroDaJanela;
}

@Injectable()
export class InscricaoTypeOrmRepository implements IInscricaoRepository {
  constructor(
    @InjectRepository(Inscricao)
    private readonly inscricaoRepository: Repository<Inscricao>,
    @InjectRepository(Aluno)
    private readonly alunoRepository: Repository<Aluno>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
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
  ) {}

  async getInscricoesComPendenciasByAluno(
    userId: string,
  ): Promise<InscricaoComPendenciasItem[]> {
    const aluno = await this.alunoRepository.findOne({
      where: { usuario: { usuario_id: userId } },
    });
    if (!aluno) throw new Error('Aluno não encontrado');

    const inscricoes = await this.inscricaoRepository.find({
      where: {
        aluno: { aluno_id: aluno.aluno_id },
        documentos: { status_documento: StatusDocumento.PENDENTE },
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
          .filter((d) => d.status_documento === StatusDocumento.PENDENTE)
          .map((documento) => {
            const validacaoMaisRecente =
              documento.validacoes?.length
                ? [...documento.validacoes].sort(
                    (a, b) =>
                      new Date(b.data_validacao || 0).getTime() -
                      new Date(a.data_validacao || 0).getTime(),
                  )[0]
                : null;
            return {
              tipo_documento: documento.tipo_documento,
              status_documento: documento.status_documento,
              documento_url: documento.documento_url,
              parecer: validacaoMaisRecente?.parecer ?? null,
              data_validacao: validacaoMaisRecente?.data_validacao ?? null,
            };
          }),
      }))
      .filter((i) => i.documentos.length > 0);
  }

  /**
   * Cria inscrição. Regra: uma conta pode ter no máximo um perfil de aluno e um de admin.
   * Quem tem perfil de aluno (Aluno vinculado ao Usuario) pode se inscrever; não bloqueamos por role (ex.: ser admin também).
   */
  async create(
    cmd: CreateInscricaoCommand,
    userId: string,
  ): Promise<InscricaoData> {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Inscricao] create: usuario_id=', userId, 'vaga_id=', cmd.vaga_id);
    }
    const alunoExists = await this.alunoRepository.findOne({
      where: { usuario: { usuario_id: userId } },
    });
    if (!alunoExists) {
      const usuarioExists = await this.usuarioRepository.findOne({
        where: { usuario_id: userId },
        select: ['usuario_id', 'email'],
      });
      if (usuarioExists) {
        console.warn(
          '[Inscricao] Aluno não encontrado: usuário existe (email=',
          usuarioExists.email,
          ') mas não possui cadastro de aluno.',
        );
        throw new Error(
          'Seu usuário não possui cadastro de aluno. Faça o cadastro como estudante (rota de cadastro de aluno) com o mesmo e-mail e senha para vincular o perfil de aluno; depois você poderá se inscrever.',
        );
      } else {
        console.warn(
          '[Inscricao] Aluno não encontrado: nenhum usuário com usuario_id=',
          userId,
        );
        throw new Error('Aluno não encontrado');
      }
    }

    const vagaExists = await this.vagasRepository.findOne({
      where: { id: cmd.vaga_id },
      relations: ['edital'],
    });
    if (!vagaExists) {
      console.warn('[Inscricao] Vaga não encontrada: vaga_id=', cmd.vaga_id);
      throw new Error('Vaga não encontrada');
    }
    const etapaInscricao = findEtapaInscricao(vagaExists.edital.etapa_edital);
    if (!isInscricaoDisponivel(vagaExists.edital)) {
      if (etapaInscricao && !isNowInsideEtapa(etapaInscricao)) {
        throw new Error(
          'As inscrições estão fora do período definido no cronograma do edital.',
        );
      }
      throw new Error('As inscrições deste edital estão fechadas no momento.');
    }

    if (alunoExists.nivel_academico !== vagaExists.edital.nivel_academico) {
      throw new Error(
        'O nível acadêmico deste processo (Graduação / Pós-graduação) não corresponde ao seu perfil de estudante.',
      );
    }

    if (vagaExists.edital.is_formulario_renovacao) {
      const beneficioAlvo = String(vagaExists.beneficio ?? '').trim().toLowerCase();
      const alunoId = alunoExists.aluno_id;

      const beneficioElegivel = await this.inscricaoRepository
        .createQueryBuilder('inscricao')
        .innerJoin('inscricao.vagas', 'vaga_historico')
        .innerJoin('vaga_historico.edital', 'edital_historico')
        .where('inscricao.aluno_id = :alunoId', { alunoId })
        .andWhere('inscricao.status_inscricao = :statusAprovada', {
          statusAprovada: StatusInscricao.APROVADA,
        })
        .andWhere('inscricao.status_beneficio_edital = :statusBeneficiario', {
          statusBeneficiario: StatusBeneficioEdital.BENEFICIARIO,
        })
        .andWhere('edital_historico.is_formulario_renovacao = false')
        .andWhere('edital_historico.nivel_academico = :nivel', {
          nivel: alunoExists.nivel_academico,
        })
        .andWhere(
          new Brackets((qb) => {
            qb.where('LOWER(TRIM(vaga_historico.beneficio)) = :beneficioEq', {
              beneficioEq: beneficioAlvo,
            }).orWhere('LOWER(vaga_historico.beneficio) LIKE :beneficioLike', {
              beneficioLike: `%${beneficioAlvo}%`,
            });
          }),
        )
        .getCount();

      if (beneficioElegivel <= 0) {
        throw new Error(
          'Para solicitar renovação, você precisa ter este benefício homologado em edital anterior.',
        );
      }
    }

    if (!vagaExists.edital.is_formulario_renovacao) {
      const editaisRenovacao = await this.editalRepository.find({
        where: {
          is_formulario_renovacao: true,
          nivel_academico: alunoExists.nivel_academico,
        },
        relations: ['vagas'],
      });

      const editalRenovacaoAberto =
        editaisRenovacao.find((editalRenov) => isInscricaoDisponivel(editalRenov)) ??
        null;

      const renovacaoEmJanelaInscricao = !!editalRenovacaoAberto;

      if (renovacaoEmJanelaInscricao && editalRenovacaoAberto?.vagas?.length) {
        const vagaIdsRenovacao = editalRenovacaoAberto.vagas.map((v) => v.id);
        const renovacaoAprovada = await this.inscricaoRepository.findOne({
          where: {
            aluno: { aluno_id: alunoExists.aluno_id },
            vagas: { id: In(vagaIdsRenovacao) },
            status_inscricao: StatusInscricao.APROVADA,
          },
        });

        if (!renovacaoAprovada) {
          const historicoAprovadoEmBeneficio = await this.inscricaoRepository.findOne({
            where: {
              aluno: { aluno_id: alunoExists.aluno_id },
              status_inscricao: StatusInscricao.APROVADA,
              vagas: {
                edital: {
                  is_formulario_renovacao: false,
                  nivel_academico: alunoExists.nivel_academico,
                },
              },
            },
            relations: ['vagas', 'vagas.edital'],
            order: { id: 'DESC' },
          });

          if (historicoAprovadoEmBeneficio) {
            throw new Error(
              'Há um formulário de renovação em andamento. Para voltar a se inscrever em editais de benefícios, conclua e tenha aprovação no formulário de renovação.',
            );
          }
        }
      }
    }

    const inscricoesExistentes = await this.inscricaoRepository.find({
      where: {
        aluno: { aluno_id: alunoExists.aluno_id },
        vagas: { id: cmd.vaga_id },
      },
      relations: ['respostas', 'respostas.pergunta', 'documentos'],
      order: { id: 'DESC' },
    });

    if (inscricoesExistentes.length > 0) {
      const candidata = inscricoesExistentes[0];
      // Recarrega por ID: com `where` composto + várias relações, o TypeORM às vezes
      // não hidrata `respostas` de forma confiável; pendências e merge precisam da mesma lista.
      const maisRecente =
        (await this.inscricaoRepository.findOne({
          where: { id: candidata.id },
          relations: ['respostas', 'respostas.pergunta', 'documentos'],
        })) ?? candidata;

      if (maisRecente.status_inscricao === StatusInscricao.EM_AJUSTE) {
        await this.entityManager.transaction(async (tx) => {
          for (const insc of inscricoesExistentes) {
            if (insc.respostas?.length) await tx.remove(insc.respostas);
            if (insc.documentos?.length) await tx.remove(insc.documentos);
            await tx.remove(insc);
          }
        });
      } else if (inscricaoTemRespostaPrecisandoAjuste(maisRecente)) {
        throw new Error(
          `Use PATCH /inscricoes/${maisRecente.id}/correcao-respostas para enviar correções (inscrição já existente com ajuste pendente).`,
        );
      } else {
        throw new Error(
          'Você já possui uma inscrição para este benefício. Não é possível se inscrever novamente.',
        );
      }
    }

    const perguntas = await this.perguntaRepository.find({
      where: { step: { edital: { id: vagaExists.edital.id } } },
    });
    const perguntasMap = new Map(perguntas.map((p) => [p.id, p]));

    if (!cmd.respostas?.length) {
      throw new Error(
        'É necessário fornecer respostas para as perguntas do edital',
      );
    }

    const respostas = await Promise.all(
      cmd.respostas.map((respostaDto) => {
        const pergunta = perguntasMap.get(respostaDto.perguntaId);
        if (!pergunta) {
          throw new Error(
            `Pergunta com ID ${respostaDto.perguntaId} não encontrada no edital`,
          );
        }
        this.validateRespostaByTipoPergunta(respostaDto, pergunta);
        const resposta = new Resposta();
        resposta.pergunta = pergunta;
        resposta.valorTexto = respostaDto.valorTexto;
        resposta.valorOpcoes = Array.isArray(respostaDto.valorOpcoes)
          ? (respostaDto.valorOpcoes as string[])
          : undefined;
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

    const saved = await this.entityManager.transaction(async (tx) => {
      return tx.save(inscricao);
    });

    try {
      const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
      if (!isNaN(userIdNum)) {
        await this.removeRespostaEmCache(cmd.vaga_id, userIdNum);
      }
    } catch (cacheErr) {
      console.warn('[Inscricao] Falha ao limpar cache (não-crítico):', (cacheErr as Error).message);
    }

    return this.toInscricaoData(saved);
  }

  /**
   * PATCH /inscricoes/:id/correcao-respostas — fluxo explícito de correção pelo aluno.
   */
  async corrigirRespostasPendentes(
    inscricaoId: number,
    cmd: CorrigirRespostasInscricaoCommand,
    userId: string,
  ): Promise<InscricaoData> {
    const alunoExists = await this.alunoRepository.findOne({
      where: { usuario: { usuario_id: userId } },
    });
    if (!alunoExists) {
      throw new Error(
        'Seu usuário não possui cadastro de aluno. Faça o cadastro como estudante (rota de cadastro de aluno) com o mesmo e-mail e senha para vincular o perfil de aluno; depois você poderá enviar correções.',
      );
    }

    const ins = await this.inscricaoRepository.findOne({
      where: { id: inscricaoId },
      relations: [
        'respostas',
        'respostas.pergunta',
        'documentos',
        'aluno',
        'vagas',
        'vagas.edital',
      ],
    });
    if (!ins) throw new Error('Inscrição não encontrada');
    if ((ins.aluno as Aluno).aluno_id !== alunoExists.aluno_id) {
      throw new Error('Você não tem permissão para alterar esta inscrição');
    }
    const vagaExists = ins.vagas as Vagas;
    if (!isAjusteDisponivel(vagaExists.edital)) {
      throw new Error(
        'Os ajustes de pendências deste edital estão fechados no momento.',
      );
    }
    if (!inscricaoTemRespostaPrecisandoAjuste(ins)) {
      throw new Error(
        'Não há respostas pendentes de correção nesta inscrição.',
      );
    }

    return this.mergeRespostasComplemento(
      ins,
      { vaga_id: vagaExists.id, respostas: cmd.respostas },
      userId,
      alunoExists,
      vagaExists,
    );
  }

  /**
   * Atualiza só as respostas enviadas quando há complemento pendente (não é EM_AJUSTE).
   */
  private async mergeRespostasComplemento(
    inscricaoBase: Inscricao,
    cmd: CreateInscricaoCommand,
    userId: string,
    alunoExists: Aluno,
    vagaExists: Vagas,
  ): Promise<InscricaoData> {
    const inscricaoId = inscricaoBase.id;

    const perguntas = await this.perguntaRepository.find({
      where: { step: { edital: { id: vagaExists.edital.id } } },
    });
    const perguntasMap = new Map(perguntas.map((p) => [p.id, p]));

    if (!cmd.respostas?.length) {
      throw new Error(
        'É necessário fornecer respostas para as perguntas do edital',
      );
    }

    await this.entityManager.transaction(async (tx) => {
      const ins = await tx.getRepository(Inscricao).findOne({
        where: { id: inscricaoId },
        relations: ['respostas', 'respostas.pergunta', 'aluno', 'vagas'],
      });
      if (!ins) throw new Error('Inscrição não encontrada');
      const alunoIns = ins.aluno as Aluno;
      const vagaIns = ins.vagas as Vagas;
      if (alunoIns.aluno_id !== alunoExists.aluno_id) {
        throw new Error('Você não tem permissão para alterar esta inscrição');
      }
      if (vagaIns.id !== vagaExists.id) {
        throw new Error('Vaga inconsistente com a inscrição');
      }

      for (const respostaDto of cmd.respostas) {
        const pid = Number(respostaDto.perguntaId);
        const pergunta = perguntasMap.get(pid);
        if (!pergunta) {
          throw new Error(
            `Pergunta com ID ${pid} não encontrada no edital`,
          );
        }
        this.validateRespostaByTipoPergunta(respostaDto, pergunta);

        const existente = (ins.respostas ?? []).find(
          (r) => (r.pergunta as Pergunta)?.id === pid,
        );
        if (!existente) {
          throw new Error(
            `Não há resposta cadastrada para a pergunta ${pid} nesta inscrição.`,
          );
        }
        if (!respostaPrecisaAjuste(existente)) {
          throw new Error(
            'Uma ou mais perguntas enviadas não estão abertas para correção no momento.',
          );
        }

        existente.valorTexto = respostaDto.valorTexto;
        existente.valorOpcoes = Array.isArray(respostaDto.valorOpcoes)
          ? (respostaDto.valorOpcoes as string[])
          : undefined;
        existente.urlArquivo = respostaDto.urlArquivo;
        existente.texto = respostaDto.valorTexto;
        existente.requerReenvio = false;
        existente.invalidada = false;
        existente.validada = false;
        existente.prazoReenvio = null;
        existente.perguntaAdicionadaPosInscricao = false;
        existente.prazoRespostaNovaPergunta = null;
        existente.parecer = null;
        // Coluna nullable no banco; entidade tipada só como Date | undefined.
        (existente as { dataValidacao?: Date | null }).dataValidacao = null;

        await tx.getRepository(Resposta).save(existente);
      }

      // Mantém o status da inscrição (ex.: APROVADA): a pendência de análise fica na
      // Resposta (validada=false). Se no futuro a PROAE exigir re-enfileirar o benefício
      // inteiro, reavalie aqui (ex.: PENDENTE só para inscrições ainda em triagem).
      await tx.getRepository(Inscricao).save(ins);
    });

    try {
      const userIdNum =
        typeof userId === 'string' ? parseInt(userId, 10) : userId;
      if (!isNaN(userIdNum)) {
        await this.removeRespostaEmCache(cmd.vaga_id, userIdNum);
      }
    } catch (cacheErr) {
      console.warn(
        '[Inscricao] Falha ao limpar cache (não-crítico):',
        (cacheErr as Error).message,
      );
    }

    const refreshed = await this.inscricaoRepository.findOne({
      where: { id: inscricaoId },
      relations: ['aluno', 'vagas', 'respostas', 'respostas.pergunta'],
    });
    if (!refreshed) throw new Error('Inscrição não encontrada');
    return this.toInscricaoData(refreshed);
  }

  async update(
    inscricaoId: number,
    cmd: UpdateInscricaoCommand,
    userId: string,
  ): Promise<InscricaoData> {
    const inscricaoExistente = await this.inscricaoRepository.findOne({
      where: { id: inscricaoId },
      relations: ['aluno', 'aluno.usuario', 'vagas', 'vagas.edital', 'respostas'],
    });
    if (!inscricaoExistente) throw new Error('Inscrição não encontrada');
    if (inscricaoExistente.aluno.usuario?.usuario_id !== userId) {
      throw new Error('Você não tem permissão para editar esta inscrição');
    }

    if (cmd.vaga_id) {
      const vagaExists = await this.vagasRepository.findOne({
        where: { id: cmd.vaga_id },
        relations: ['edital'],
      });
      if (!vagaExists) throw new Error('Vaga não encontrada');
      const etapaInscricao = findEtapaInscricao(vagaExists.edital.etapa_edital);
      if (!isInscricaoDisponivel(vagaExists.edital)) {
        if (etapaInscricao && !isNowInsideEtapa(etapaInscricao)) {
          throw new Error(
            'As inscrições estão fora do período definido no cronograma do edital.',
          );
        }
        throw new Error('As inscrições deste edital estão fechadas no momento.');
      }
      inscricaoExistente.vagas = vagaExists;
    }

    if (cmd.respostas?.length) {
      const perguntas = await this.perguntaRepository.find({
        where: {
          step: { edital: { id: inscricaoExistente.vagas.edital.id } },
        },
      });
      const perguntasMap = new Map(perguntas.map((p) => [p.id, p]));
      const novasRespostas = cmd.respostas.map((respostaDto) => {
        const pergunta = perguntasMap.get(respostaDto.perguntaId);
        if (!pergunta) {
          throw new Error(
            `Pergunta com ID ${respostaDto.perguntaId} não encontrada no edital`,
          );
        }
        this.validateRespostaByTipoPergunta(respostaDto, pergunta);
        const resposta = new Resposta();
        resposta.pergunta = pergunta;
        resposta.valorTexto = respostaDto.valorTexto;
        resposta.valorOpcoes = Array.isArray(respostaDto.valorOpcoes)
          ? (respostaDto.valorOpcoes as string[])
          : undefined;
        resposta.urlArquivo = respostaDto.urlArquivo;
        resposta.texto = respostaDto.valorTexto;
        return resposta;
      });
      await this.respostaRepository.delete({
        inscricao: { id: inscricaoId },
      });
      inscricaoExistente.respostas = novasRespostas;
    }

    if (cmd.respostas_editadas?.length) {
      for (const respostaDto of cmd.respostas_editadas) {
        const respostaExistente = await this.respostaRepository.findOne({
          where: {
            pergunta: { id: respostaDto.perguntaId },
            inscricao: { id: inscricaoId },
          },
        });
        if (!respostaExistente) {
          throw new Error(
            `Resposta para a pergunta ${respostaDto.perguntaId} não encontrada na inscrição`,
          );
        }
        if (respostaDto.valorTexto !== undefined) {
          respostaExistente.valorTexto = respostaDto.valorTexto;
          respostaExistente.texto = respostaDto.valorTexto;
        }
        if (respostaDto.valorOpcoes !== undefined) {
          respostaExistente.valorOpcoes = Array.isArray(respostaDto.valorOpcoes)
            ? (respostaDto.valorOpcoes as string[])
            : undefined;
        }
        if (respostaDto.urlArquivo !== undefined) {
          respostaExistente.urlArquivo = respostaDto.urlArquivo;
        }
        await this.respostaRepository.save(respostaExistente);
      }
    }

    if (cmd.data_inscricao !== undefined) {
      inscricaoExistente.data_inscricao = cmd.data_inscricao;
    }
    if (cmd.status_inscricao !== undefined) {
      inscricaoExistente.status_inscricao =
        cmd.status_inscricao as unknown as StatusInscricao;
    }

    const saved = await this.entityManager.transaction(async (tx) => {
      return tx.save(inscricaoExistente);
    });
    return this.toInscricaoData(saved);
  }

  private toInscricaoData(inscricao: Inscricao): InscricaoData {
    const vagas = inscricao.vagas as Vagas;
    return {
      aluno_id: (inscricao.aluno as Aluno).aluno_id,
      vaga_id: vagas?.id ?? 0,
      data_inscricao: inscricao.data_inscricao,
      status_inscricao: inscricao.status_inscricao as unknown as string,
      respostas: (inscricao.respostas ?? []).map((r) => ({
        perguntaId: (r.pergunta as Pergunta).id,
        valorTexto: r.valorTexto,
        valorOpcoes: r.valorOpcoes,
        urlArquivo: r.urlArquivo,
      })),
    };
  }

  private validateRespostaByTipoPergunta(
    respostaDto: { valorTexto?: string; valorOpcoes?: unknown; urlArquivo?: string },
    pergunta: Pergunta,
  ): void {
    const tipo = (pergunta as unknown as { tipo_Pergunta: string }).tipo_Pergunta;
    const perguntaTexto = (pergunta as unknown as { pergunta: string }).pergunta;
    switch (tipo) {
      case 'text':
        if (!respostaDto.valorTexto?.trim()) {
          throw new Error(
            `Resposta para a pergunta "${perguntaTexto}" não pode estar vazia`,
          );
        }
        break;
      case 'select':
        if (
          !respostaDto.valorOpcoes ||
          (Array.isArray(respostaDto.valorOpcoes) &&
            respostaDto.valorOpcoes.length === 0)
        ) {
          throw new Error(
            `Resposta para a pergunta "${perguntaTexto}" deve ter pelo menos uma opção selecionada`,
          );
        }
        break;
      case 'file':
        if (!respostaDto.urlArquivo?.trim()) {
          throw new Error(
            `Resposta para a pergunta "${perguntaTexto}" deve incluir um arquivo`,
          );
        }
        break;
      default:
        if (!respostaDto.valorTexto?.trim()) {
          throw new Error(
            `Resposta para a pergunta "${perguntaTexto}" não pode estar vazia`,
          );
        }
    }
  }

  private async removeRespostaEmCache(
    vagaId: number,
    userId: number,
  ): Promise<void> {
    const vagaExists = await this.vagasRepository.findOne({
      where: { id: vagaId },
      relations: ['edital'],
    });
    if (!vagaExists) return;
    const key = `userId:${userId}:form:${vagaId}:edital:${vagaExists.edital.id}`;
    await this.redisService.deleteValue(key);
  }
}
