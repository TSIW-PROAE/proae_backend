import { Inject, Injectable } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { Inscricao } from '../entities/inscricao/inscricao.entity';
import { Aluno } from '../entities/aluno/aluno.entity';
import { Usuario } from '../entities/usuarios/usuario.entity';
import { Vagas } from '../entities/vagas/vagas.entity';
import { Edital } from '../entities/edital/edital.entity';
import { Pergunta } from '../entities/pergunta/pergunta.entity';
import { Resposta } from '../entities/resposta/resposta.entity';
import { StatusEdital } from '../../../../core/shared-kernel/enums/enumStatusEdital';
import { StatusDocumento } from '../../../../core/shared-kernel/enums/statusDocumento';
import { StatusInscricao } from '../../../../core/shared-kernel/enums/enumStatusInscricao';
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
    if (vagaExists.edital.status_edital !== StatusEdital.ABERTO) {
      throw new Error('Edital não está aberto para inscrições');
    }

    if (alunoExists.nivel_academico !== vagaExists.edital.nivel_academico) {
      throw new Error(
        'O nível acadêmico deste processo (Graduação / Pós-graduação) não corresponde ao seu perfil de estudante.',
      );
    }

    if (!vagaExists.edital.is_formulario_geral) {
      const editalFG = await this.editalRepository.findOne({
        where: {
          is_formulario_geral: true,
          nivel_academico: alunoExists.nivel_academico,
        },
        relations: ['vagas'],
      });
      if (editalFG?.vagas?.length) {
        const vagaIdsFG = editalFG.vagas.map((v) => v.id);
        const inscricaoFG = await this.inscricaoRepository.findOne({
          where: {
            aluno: { aluno_id: alunoExists.aluno_id },
            vagas: { id: In(vagaIdsFG) },
            status_inscricao: StatusInscricao.APROVADA,
          },
        });
        if (!inscricaoFG) {
          throw new Error(
            'É necessário ter o Formulário Geral preenchido e aprovado para se inscrever em outros editais/benefícios.',
          );
        }
      }
    }

    if (
      !vagaExists.edital.is_formulario_geral &&
      !vagaExists.edital.is_formulario_renovacao
    ) {
      const editalRenov = await this.editalRepository.findOne({
        where: {
          is_formulario_renovacao: true,
          status_edital: StatusEdital.ABERTO,
          nivel_academico: alunoExists.nivel_academico,
        },
        relations: ['vagas'],
      });
      if (editalRenov?.vagas?.length) {
        const algumaAprovadaNivel = await this.inscricaoRepository
          .createQueryBuilder('i')
          .innerJoin('i.aluno', 'aluno')
          .innerJoin('i.vagas', 'v')
          .innerJoin('v.edital', 'e')
          .where('aluno.aluno_id = :aid', { aid: alunoExists.aluno_id })
          .andWhere('i.status_inscricao = :st', {
            st: StatusInscricao.APROVADA,
          })
          .andWhere('e.nivel_academico = :nivel', {
            nivel: alunoExists.nivel_academico,
          })
          .andWhere('e.is_formulario_renovacao = false')
          .getOne();
        if (algumaAprovadaNivel) {
          const vagaRenovIds = editalRenov.vagas.map((v) => v.id);
          const renovacaoOk = await this.inscricaoRepository.findOne({
            where: {
              aluno: { aluno_id: alunoExists.aluno_id },
              status_inscricao: StatusInscricao.APROVADA,
              vagas: { id: In(vagaRenovIds) },
            },
          });
          if (!renovacaoOk) {
            throw new Error(
              'Há formulário de renovação aberto para o seu nível. Conclua-o e aguarde aprovação antes de novas inscrições em editais.',
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
    if (vagaExists.edital.status_edital !== StatusEdital.ABERTO) {
      throw new Error('Edital não está aberto para correções');
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
      if (vagaExists.edital.status_edital !== StatusEdital.ABERTO) {
        throw new Error('Edital não está aberto para atualizações');
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
