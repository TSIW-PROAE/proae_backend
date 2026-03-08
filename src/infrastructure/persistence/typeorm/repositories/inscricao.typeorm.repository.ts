import { Inject, Injectable } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Inscricao } from '../../../../entities/inscricao/inscricao.entity';
import { Aluno } from '../../../../entities/aluno/aluno.entity';
import { Vagas } from '../../../../entities/vagas/vagas.entity';
import { Edital } from '../../../../entities/edital/edital.entity';
import { Pergunta } from '../../../../entities/pergunta/pergunta.entity';
import { Resposta } from '../../../../entities/resposta/resposta.entity';
import { StatusEdital } from '../../../../core/shared-kernel/enums/enumStatusEdital';
import { StatusDocumento } from '../../../../core/shared-kernel/enums/statusDocumento';
import { StatusInscricao } from '../../../../core/shared-kernel/enums/enumStatusInscricao';
import type { IInscricaoRepository } from '../../../../core/domain/inscricao';
import type {
  InscricaoComPendenciasItem,
  CreateInscricaoCommand,
  UpdateInscricaoCommand,
  InscricaoData,
} from '../../../../core/domain/inscricao';
import { CACHE_PORT, type CachePort } from '../../../../core/application/utilities';

@Injectable()
export class InscricaoTypeOrmRepository implements IInscricaoRepository {
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

  async create(
    cmd: CreateInscricaoCommand,
    userId: string,
  ): Promise<InscricaoData> {
    const alunoExists = await this.alunoRepository.findOne({
      where: { usuario: { usuario_id: userId } },
    });
    if (!alunoExists) throw new Error('Aluno não encontrado');

    const vagaExists = await this.vagasRepository.findOne({
      where: { id: cmd.vaga_id },
      relations: ['edital'],
    });
    if (!vagaExists) throw new Error('Vaga não encontrada');
    if (vagaExists.edital.status_edital !== StatusEdital.ABERTO) {
      throw new Error('Edital não está aberto para inscrições');
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

    const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (!isNaN(userIdNum)) {
      await this.removeRespostaEmCache(cmd.vaga_id, userIdNum);
    }

    return this.toInscricaoData(saved);
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
