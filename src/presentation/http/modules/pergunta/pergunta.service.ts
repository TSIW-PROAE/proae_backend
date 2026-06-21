import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { In, Repository } from 'typeorm';
import { CreatePerguntaUseCase } from 'src/core/application/pergunta/use-cases/create-pergunta.use-case';
import { FindPerguntasByStepUseCase } from 'src/core/application/pergunta/use-cases/find-perguntas-by-step.use-case';
import { RemovePerguntaUseCase } from 'src/core/application/pergunta/use-cases/remove-pergunta.use-case';
import { ReorderPerguntasUseCase } from 'src/core/application/pergunta/use-cases/reorder-perguntas.use-case';
import { UpdatePerguntaUseCase } from 'src/core/application/pergunta/use-cases/update-pergunta.use-case';
import type { PerguntaData } from 'src/core/domain/pergunta/pergunta.types';
import type { EmailSenderPort } from 'src/core/application/utilities/ports/email-sender.port';
import { EMAIL_SENDER } from 'src/core/application/utilities/utility.tokens';
import { InputFormatPlaceholders } from 'src/core/shared-kernel/enums/enumInputFormat';
import { Inscricao } from 'src/infrastructure/persistence/typeorm/entities/inscricao/inscricao.entity';
import { Resposta } from 'src/infrastructure/persistence/typeorm/entities/resposta/resposta.entity';
import { Step } from 'src/infrastructure/persistence/typeorm/entities/step/step.entity';
import { Dado } from 'src/infrastructure/persistence/typeorm/entities/tipoDado/tipoDado.entity';
import { Vagas } from 'src/infrastructure/persistence/typeorm/entities/vagas/vagas.entity';
import { PerguntaResponseDto } from 'src/presentation/http/modules/step/dto/response-pergunta.dto';
import { CreatePerguntaDto } from './dto/create-pergunta.dto';
import { ReorderPerguntasDto } from './dto/reorder-perguntas.dto';
import { UpdatePerguntaDto } from './dto/update-pergunta.dto';

@Injectable()
export class PerguntaService {
  constructor(
    @InjectRepository(Step) private readonly stepRepository: Repository<Step>,
    @InjectRepository(Dado) private readonly dadoRepository: Repository<Dado>,
    @InjectRepository(Inscricao)
    private readonly inscricaoRepository: Repository<Inscricao>,
    @InjectRepository(Resposta)
    private readonly respostaRepository: Repository<Resposta>,
    @InjectRepository(Vagas) private readonly vagasRepository: Repository<Vagas>,
    @Inject(EMAIL_SENDER)
    private readonly emailSender: EmailSenderPort,
    private readonly findPerguntasByStepUseCase: FindPerguntasByStepUseCase,
    private readonly createPerguntaUseCase: CreatePerguntaUseCase,
    private readonly updatePerguntaUseCase: UpdatePerguntaUseCase,
    private readonly removePerguntaUseCase: RemovePerguntaUseCase,
    private readonly reorderPerguntasUseCase: ReorderPerguntasUseCase,
  ) {}

  private portalAlunoUrl(path = '/portal-aluno/pendencias'): string {
    const base = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
    const suffix = path.startsWith('/') ? path : `/${path}`;
    return `${base}${suffix}`;
  }

  async findByStep(stepId: number): Promise<PerguntaResponseDto[]> {
    try {
      const perguntas = await this.findPerguntasByStepUseCase.execute(stepId);
      return Promise.all(perguntas.map((pergunta) => this.toResponse(pergunta)));
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Erro ao buscar perguntas:', error);
      throw new InternalServerErrorException();
    }
  }

  async create(
    createPerguntaDto: CreatePerguntaDto,
  ): Promise<PerguntaResponseDto> {
    try {
      const step = await this.stepRepository.findOneBy({
        id: createPerguntaDto.step_id,
      });

      if (!step) {
        throw new NotFoundException(
          `Step com ID ${createPerguntaDto.step_id} não encontrado. Verifique se o step existe e tente novamente.`,
        );
      }

      if (createPerguntaDto.dadoId) {
        const dado = await this.dadoRepository.findOneBy({
          id: createPerguntaDto.dadoId,
        });

        if (!dado) {
          throw new NotFoundException('Dado não encontrado');
        }
      }
      const savedPergunta = await this.createPerguntaUseCase.execute({
        stepId: createPerguntaDto.step_id,
        tipoPergunta: createPerguntaDto.tipo_Pergunta,
        texto: createPerguntaDto.pergunta,
        obrigatoria: createPerguntaDto.obrigatoriedade,
        opcoes: createPerguntaDto.opcoes ?? [],
        tipoFormatacao: createPerguntaDto.tipo_formatacao ?? null,
        dadoId: createPerguntaDto.dadoId ?? null,
        ordem: createPerguntaDto.ordem ?? undefined,
        condicao: (createPerguntaDto.condicao ?? null) as
          | { pergunta_id_origem: number; operador: 'equals' | 'notEquals' | 'includes' | 'notIncludes'; valor: string | string[] }
          | null,
        pontuacaoValidacao: createPerguntaDto.pontuacao_validacao ?? 0,
      });

      if (createPerguntaDto.prazoResposta) {
        const prazo = new Date(createPerguntaDto.prazoResposta);
        if (Number.isNaN(prazo.getTime())) {
          throw new BadRequestException(
            'prazoResposta inválido. Use uma data/hora válida (ISO 8601).',
          );
        }
        await this.propagarNovaPerguntaParaInscricoes(
          savedPergunta.id,
          createPerguntaDto.step_id,
          prazo,
        );
      }

      return this.toResponse(savedPergunta);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Erro ao criar pergunta:', error);
      throw new InternalServerErrorException();
    }
  }

  async update(
    id: number,
    updatePerguntaDto: UpdatePerguntaDto,
  ): Promise<PerguntaResponseDto> {
    try {
      if (updatePerguntaDto.dadoId !== undefined) {
        if (updatePerguntaDto.dadoId !== null && updatePerguntaDto.dadoId !== 0) {
          const dado = await this.dadoRepository.findOneBy({
            id: updatePerguntaDto.dadoId,
          });
          if (!dado) {
            throw new NotFoundException(
              `Dado com ID ${updatePerguntaDto.dadoId} não encontrado`,
            );
          }
        }
      }

      const updatedPergunta = await this.updatePerguntaUseCase.execute(id, {
        texto: updatePerguntaDto.pergunta,
        obrigatoria: updatePerguntaDto.obrigatoriedade,
        opcoes: updatePerguntaDto.opcoes,
        tipoFormatacao: updatePerguntaDto.tipo_formatacao,
        dadoId:
          updatePerguntaDto.dadoId === 0
            ? null
            : (updatePerguntaDto.dadoId ?? undefined),
        ordem: updatePerguntaDto.ordem,
        // condicao=null remove a regra; undefined deixa intacta.
        condicao: (updatePerguntaDto.condicao === undefined
          ? undefined
          : updatePerguntaDto.condicao) as
          | { pergunta_id_origem: number; operador: 'equals' | 'notEquals' | 'includes' | 'notIncludes'; valor: string | string[] }
          | null
          | undefined,
        pontuacaoValidacao: updatePerguntaDto.pontuacao_validacao,
      });
      return this.toResponse(updatedPergunta);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof Error && error.message === 'Pergunta não encontrada') {
        throw new NotFoundException('Pergunta não encontrada');
      }
      console.error('Erro ao atualizar pergunta:', error);
      throw new InternalServerErrorException();
    }
  }

  async remove(id: number): Promise<{ message: string }> {
    try {
      await this.removePerguntaUseCase.execute(id);
      return { message: 'Pergunta removida com sucesso' };
    } catch (error) {
      if (error instanceof Error && error.message === 'Pergunta não encontrada') {
        throw new NotFoundException('Pergunta não encontrada');
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Erro ao remover pergunta:', error);
      throw new InternalServerErrorException();
    }
  }

  /**
   * Reordena perguntas dentro de um step. Atualiza somente o campo `ordem`,
   * sem excluir/recriar registros — preserva respostas históricas.
   */
  async reorderByStep(
    stepId: number,
    dto: ReorderPerguntasDto,
  ): Promise<{ message: string }> {
    try {
      const step = await this.stepRepository.findOneBy({ id: stepId });
      if (!step) {
        throw new NotFoundException(
          `Step com ID ${stepId} não encontrado.`,
        );
      }
      await this.reorderPerguntasUseCase.execute({
        stepId,
        updates: dto.itens.map((it) => ({ id: it.id, ordem: it.ordem })),
      });
      return { message: 'Perguntas reordenadas com sucesso' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Erro ao reordenar perguntas:', error);
      throw new InternalServerErrorException();
    }
  }

  /**
   * Edital com inscrições existentes: cria resposta vazia marcada como
   * pergunta pós-inscrição para cada inscrição que ainda não tem essa pergunta.
   */
  private async propagarNovaPerguntaParaInscricoes(
    perguntaId: number,
    stepId: number,
    prazo: Date,
  ): Promise<void> {
    const step = await this.stepRepository.findOne({
      where: { id: stepId },
      relations: ['edital'],
    });
    const editalId = step?.edital?.id;
    if (!editalId) return;

    const vagas = await this.vagasRepository.find({
      where: { edital: { id: editalId } },
    });
    if (!vagas.length) return;

    const vagaIds = vagas.map((v) => v.id);
    const inscricoes = await this.inscricaoRepository.find({
      where: { vagas: { id: In(vagaIds) } },
      relations: ['respostas', 'respostas.pergunta', 'aluno', 'aluno.usuario', 'vagas', 'vagas.edital'],
    });

    for (const inscricao of inscricoes) {
      const jaExiste = (inscricao.respostas ?? []).some(
        (r) => r.pergunta?.id === perguntaId,
      );
      if (jaExiste) continue;

      const resposta = this.respostaRepository.create({
        pergunta: { id: perguntaId } as Resposta['pergunta'],
        inscricao: { id: inscricao.id } as Resposta['inscricao'],
        perguntaAdicionadaPosInscricao: true,
        prazoRespostaNovaPergunta: prazo,
        validada: false,
        invalidada: false,
        requerReenvio: false,
        valorOpcoes: [],
      });
      await this.respostaRepository.save(resposta);

      const email = inscricao.aluno?.usuario?.email;
      if (email) {
        try {
          const nome = inscricao.aluno?.usuario?.nome ?? null;
          const tituloEdital = inscricao.vagas?.edital?.titulo_edital ?? 'Edital';
          await this.emailSender.sendAlunoProcessNotification({
            email,
            nome,
            subject: `[PROAE] [Edital de Benefícios] [Nova pendência] ${tituloEdital}`,
            title: 'Nova pergunta para complementar sua inscrição',
            message: `Foi adicionada uma nova pergunta na sua inscrição do edital "${tituloEdital}". Você precisa complementar as respostas no sistema.`,
            prazoLimite: prazo,
            ctaUrl: this.portalAlunoUrl('/portal-aluno/pendencias'),
            ctaLabel: 'Responder pendência',
          });
        } catch (emailErr) {
          console.warn(
            '[pergunta] Falha ao enviar e-mail de nova pergunta:',
            (emailErr as Error).message,
          );
        }
      }
    }
  }

  private async toResponse(pergunta: PerguntaData): Promise<PerguntaResponseDto> {
    const dado =
      pergunta.dadoId && pergunta.dadoId > 0
        ? await this.dadoRepository.findOneBy({ id: pergunta.dadoId })
        : null;

    const payload = {
      id: pergunta.id,
      pergunta: pergunta.texto,
      tipo_Pergunta: pergunta.tipoPergunta,
      obrigatoriedade: pergunta.obrigatoria,
      opcoes: pergunta.opcoes ?? [],
      tipo_formatacao: pergunta.tipoFormatacao,
      dado: dado ? { id: dado.id, nome: dado.nome } : undefined,
      ordem: pergunta.ordem ?? 0,
      condicao: pergunta.condicao ?? null,
      pontuacao_validacao: Number(pergunta.pontuacaoValidacao ?? 0),
    };

    const perguntaDto = plainToInstance(PerguntaResponseDto, payload, {
      excludeExtraneousValues: true,
    });
    perguntaDto.placeholder =
      InputFormatPlaceholders[
        (pergunta.tipoFormatacao ?? 'none') as keyof typeof InputFormatPlaceholders
      ];
    return perguntaDto;
  }
}
