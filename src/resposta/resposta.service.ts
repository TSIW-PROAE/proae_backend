import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resposta } from '../entities/resposta/resposta.entity';
import { Pergunta } from '../entities/pergunta/pergunta.entity';
import { Inscricao } from '../entities/inscricao/inscricao.entity';
import { CreateRespostaDto } from './dto/create-resposta.dto';
import { RespostaResponseDto } from './dto/response-resposta.dto';
import { plainToInstance } from 'class-transformer';
import { UpdateRespostaDto } from './dto/update-resposta.dto';
import { ValidateRespostaDto } from './dto/validate-resposta.dto';
import { MinioClientService } from '../minio/minio.service';
import { Aluno } from '../entities/aluno/aluno.entity';
import { Usuario } from '../entities/usuarios/usuario.entity';
import { Step } from '../entities/step/step.entity';
import { Edital } from '../entities/edital/edital.entity';
import { Vagas } from '../entities/vagas/vagas.entity';
import { ValorDado } from '../entities/valorDado/valorDado.entity';
import { Dado } from '../entities/tipoDado/tipoDado.entity';
import { InputFormatPlaceholders } from '../enum/enumInputFormat';
import { PerguntaResponseDto } from '../step/dto/response-pergunta.dto';
import { StatusInscricao } from '../enum/enumStatusInscricao';

@Injectable()
export class RespostaService {
  constructor(
    @InjectRepository(Resposta)
    private readonly respostaRepository: Repository<Resposta>,
    @InjectRepository(Pergunta)
    private readonly perguntaRepository: Repository<Pergunta>,
    @InjectRepository(Inscricao)
    private readonly inscricaoRepository: Repository<Inscricao>,
    @InjectRepository(Aluno)
    private readonly alunoRepository: Repository<Aluno>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(Step)
    private readonly stepRepository: Repository<Step>,
    @InjectRepository(Edital)
    private readonly editalRepository: Repository<Edital>,
    @InjectRepository(Vagas)
    private readonly vagasRepository: Repository<Vagas>,
    @InjectRepository(ValorDado)
    private readonly valorDadoRepository: Repository<ValorDado>,
    @InjectRepository(Dado)
    private readonly dadoRepository: Repository<Dado>,
    private readonly minioService: MinioClientService,
  ) {}

  async create(
    dto: CreateRespostaDto,
    files?: Express.Multer.File[],
  ): Promise<RespostaResponseDto> {
    const pergunta = await this.perguntaRepository.findOneBy({
      id: dto.perguntaId,
    });
    if (!pergunta) throw new NotFoundException('Pergunta não encontrada');

    const inscricao = await this.inscricaoRepository.findOneBy({
      id: dto.inscricaoId,
    });
    if (!inscricao) throw new NotFoundException('Inscrição não encontrada');

    let urlArquivo: string | undefined;

    if (files && files.length > 0) {
      const uploadResult = await this.minioService.uploadDocuments(
        inscricao.id,
        files,
      );
      urlArquivo = uploadResult.arquivos[0].nome_do_arquivo;
    }

    const resposta = this.respostaRepository.create({
      valorTexto: dto.valorTexto,
      valorOpcoes: dto.valorOpcoes,
      urlArquivo: urlArquivo || dto.urlArquivo,
      pergunta,
      inscricao,
    });

    const saved = await this.respostaRepository.save(resposta);

    return plainToInstance(
      RespostaResponseDto,
      {
        ...saved,
        perguntaId: pergunta.id,
        inscricaoId: inscricao.id,
      },
      { excludeExtraneousValues: true },
    );
  }

  async findAll(): Promise<RespostaResponseDto[]> {
    const respostas = await this.respostaRepository.find({
      relations: ['pergunta', 'inscricao'],
    });

    return respostas.map((r) =>
      plainToInstance(
        RespostaResponseDto,
        { ...r, perguntaId: r.pergunta?.id, inscricaoId: r.inscricao?.id },
        { excludeExtraneousValues: true },
      ),
    );
  }

  async findOne(id: number): Promise<RespostaResponseDto> {
    const resposta = await this.respostaRepository.findOne({
      where: { id },
      relations: ['pergunta', 'inscricao'],
    });
    if (!resposta) throw new NotFoundException('Resposta não encontrada');

    return plainToInstance(
      RespostaResponseDto,
      {
        ...resposta,
        perguntaId: resposta.pergunta?.id,
        inscricaoId: resposta.inscricao?.id,
      },
      { excludeExtraneousValues: true },
    );
  }

  async update(
    id: number,
    dto: UpdateRespostaDto,
  ): Promise<RespostaResponseDto> {
    const resposta = await this.respostaRepository.findOne({
      where: { id },
      relations: ['inscricao'],
    });
    if (!resposta) throw new NotFoundException('Resposta não encontrada');

    // Detectar reenvio: resposta estava invalidada com requerReenvio
    const isReenvio =
      resposta.invalidada === true && resposta.requerReenvio === true;

    Object.assign(resposta, dto);

    if (isReenvio) {
      // Resetar campos de validação — volta para "pendente de análise"
      resposta.validada = false;
      resposta.invalidada = false;
      resposta.requerReenvio = false;
      resposta.parecer = null;
      resposta.prazoReenvio = null;
      resposta.dataValidacao = undefined;
    }

    const updated = await this.respostaRepository.save(resposta);

    // Atualizar status da inscrição após reenvio
    if (isReenvio) {
      await this.atualizarStatusInscricao(resposta.inscricao.id);
    }

    return plainToInstance(RespostaResponseDto, updated, {
      excludeExtraneousValues: true,
    });
  }

  async remove(id: number): Promise<void> {
    const result = await this.respostaRepository.delete(id);
    if (result.affected === 0)
      throw new NotFoundException('Resposta não encontrada');
  }

  async findRespostasAlunoEdital(alunoId: number, editalId: number) {
    const edital = await this.editalRepository.findOne({
      where: { id: editalId },
    });
    if (!edital) throw new NotFoundException('Edital não encontrado');

    const aluno = await this.alunoRepository.findOne({
      where: { aluno_id: alunoId },
      relations: ['usuario'],
    });
    if (!aluno) throw new NotFoundException('Aluno não encontrado');

    const vagas = await this.vagasRepository.find({
      where: { edital: { id: editalId } },
    });

    if (!vagas || vagas.length === 0) {
      return {
        sucesso: true,
        dados: [],
        mensagem: 'Nenhuma vaga encontrada para este edital.',
      };
    }

    const vagaIds = vagas.map((vaga) => vaga.id);
    const inscricoes = await this.inscricaoRepository.find({
      where: {
        aluno: { aluno_id: alunoId },
        vagas: { id: vagaIds[0] },
      },
      relations: ['respostas', 'respostas.pergunta', 'respostas.pergunta.step'],
    });

    const respostas = inscricoes.flatMap((inscricao) => inscricao.respostas);

    return {
      sucesso: true,
      dados: {
        edital: {
          id: edital.id,
          titulo: edital.titulo_edital,
          descricao: edital.descricao,
          status: edital.status_edital,
        },
        aluno: {
          aluno_id: aluno.aluno_id,
          nome: aluno.usuario.nome,
          email: aluno.usuario.email,
          matricula: aluno.matricula,
        },
        total_respostas: respostas.length,
        respostas: respostas.map((resposta) => ({
          id: resposta.id,
          pergunta_id: resposta.pergunta.id,
          pergunta_texto: resposta.pergunta.pergunta,
          step_id: resposta.pergunta.step.id,
          step_texto: resposta.pergunta.step.texto,
          resposta_texto: resposta.valorTexto,
          valor_opcoes: resposta.valorOpcoes,
          url_arquivo: resposta.urlArquivo,
          data_resposta: resposta.dataResposta,
        })),
      },
    };
  }

  async findRespostasAlunoStep(
    alunoId: number,
    editalId: number,
    stepId: number,
  ) {
    const edital = await this.editalRepository.findOne({
      where: { id: editalId },
    });
    if (!edital) throw new NotFoundException('Edital não encontrado');

    const step = await this.stepRepository.findOne({
      where: { id: stepId, edital: { id: editalId } },
    });
    if (!step) throw new NotFoundException('Step não encontrado no edital');

    const aluno = await this.alunoRepository.findOne({
      where: { aluno_id: alunoId },
      relations: ['usuario'],
    });
    if (!aluno) throw new NotFoundException('Aluno não encontrado');

    const vagas = await this.vagasRepository.find({
      where: { edital: { id: editalId } },
    });

    if (!vagas || vagas.length === 0) {
      return {
        sucesso: true,
        dados: [],
        mensagem: 'Nenhuma vaga encontrada para este edital.',
      };
    }

    const vagaIds = vagas.map((vaga) => vaga.id);
    const inscricoes = await this.inscricaoRepository.find({
      where: {
        aluno: { aluno_id: alunoId },
        vagas: { id: vagaIds[0] },
      },
      relations: ['respostas', 'respostas.pergunta', 'respostas.pergunta.step'],
    });

    const respostas = inscricoes
      .flatMap((inscricao) => inscricao.respostas)
      .filter((resposta) => resposta.pergunta.step.id === stepId);

    return {
      sucesso: true,
      dados: {
        edital: {
          id: edital.id,
          titulo: edital.titulo_edital,
          descricao: edital.descricao,
          status: edital.status_edital,
        },
        step: {
          id: step.id,
          texto: step.texto,
        },
        aluno: {
          aluno_id: aluno.aluno_id,
          nome: aluno.usuario.nome,
          email: aluno.usuario.email,
          matricula: aluno.matricula,
        },
        total_respostas: respostas.length,
        respostas: respostas.map((resposta) => ({
          id: resposta.id,
          pergunta_id: resposta.pergunta.id,
          pergunta_texto: resposta.pergunta.pergunta,
          resposta_texto: resposta.valorTexto,
          valor_opcoes: resposta.valorOpcoes,
          url_arquivo: resposta.urlArquivo,
          data_resposta: resposta.dataResposta,
        })),
      },
    };
  }

  async findRespostasPerguntaEdital(perguntaId: number, editalId: number) {
    const edital = await this.editalRepository.findOne({
      where: { id: editalId },
    });
    if (!edital) throw new NotFoundException('Edital não encontrado');

    const pergunta = await this.perguntaRepository.findOne({
      where: { id: perguntaId },
      relations: ['step', 'step.edital'],
    });
    if (!pergunta) throw new NotFoundException('Pergunta não encontrada');

    if (pergunta.step.edital.id !== editalId) {
      throw new NotFoundException(
        'Pergunta não pertence ao edital especificado',
      );
    }

    const vagas = await this.vagasRepository.find({
      where: { edital: { id: editalId } },
    });

    if (!vagas || vagas.length === 0) {
      return {
        sucesso: true,
        dados: [],
        mensagem: 'Nenhuma vaga encontrada para este edital.',
      };
    }

    const vagaIds = vagas.map((vaga) => vaga.id);
    const respostas = await this.respostaRepository.find({
      where: {
        pergunta: { id: perguntaId },
        inscricao: {
          vagas: { id: vagaIds[0] },
        },
      },
      relations: [
        'inscricao',
        'inscricao.aluno',
        'inscricao.aluno.usuario',
        'pergunta',
      ],
    });

    return {
      sucesso: true,
      dados: {
        edital: {
          id: edital.id,
          titulo: edital.titulo_edital,
          descricao: edital.descricao,
          status: edital.status_edital,
        },
        pergunta: {
          id: pergunta.id,
          texto: pergunta.pergunta,
          tipo: pergunta.tipo_Pergunta,
          obrigatoriedade: pergunta.obrigatoriedade,
        },
        total_respostas: respostas.length,
        respostas: respostas.map((resposta) => ({
          id: resposta.id,
          aluno: {
            aluno_id: resposta.inscricao.aluno.aluno_id,
            nome: resposta.inscricao.aluno.usuario.nome,
            email: resposta.inscricao.aluno.usuario.email,
            matricula: resposta.inscricao.aluno.matricula,
          },
          resposta_texto: resposta.valorTexto,
          valor_opcoes: resposta.valorOpcoes,
          url_arquivo: resposta.urlArquivo,
          data_resposta: resposta.dataResposta,
        })),
      },
    };
  }

  async findPerguntasComRespostasAlunoStep(
    alunoId: number,
    editalId: number,
    stepId: number,
  ) {
    // Validar edital
    const edital = await this.editalRepository.findOne({
      where: { id: editalId },
    });
    if (!edital) throw new NotFoundException('Edital não encontrado');

    // Validar step e verificar se pertence ao edital
    const step = await this.stepRepository.findOne({
      where: { id: stepId, edital: { id: editalId } },
      relations: ['edital'],
    });
    if (!step) throw new NotFoundException('Step não encontrado no edital');

    // Validar aluno
    const aluno = await this.alunoRepository.findOne({
      where: { aluno_id: alunoId },
      relations: ['usuario'],
    });
    if (!aluno) throw new NotFoundException('Aluno não encontrado');

    // Buscar todas as perguntas do step
    const perguntas = await this.perguntaRepository.find({
      where: { step: { id: stepId } },
      relations: ['dado'],
      order: { id: 'ASC' },
    });

    // Buscar vagas do edital
    const vagas = await this.vagasRepository.find({
      where: { edital: { id: editalId } },
    });

    if (!vagas || vagas.length === 0) {
      return {
        sucesso: true,
        dados: {
          edital: {
            id: edital.id,
            titulo: edital.titulo_edital,
            descricao: edital.descricao,
            status: edital.status_edital,
          },
          step: {
            id: step.id,
            texto: step.texto,
          },
          aluno: {
            aluno_id: aluno.aluno_id,
            nome: aluno.usuario.nome,
            email: aluno.usuario.email,
            matricula: aluno.matricula,
          },
          perguntas: perguntas.map((pergunta) => {
            const perguntaDto = plainToInstance(PerguntaResponseDto, pergunta, {
              excludeExtraneousValues: true,
            });
            perguntaDto.placeholder =
              InputFormatPlaceholders[pergunta.tipo_formatacao];
            return {
              pergunta: perguntaDto,
              resposta: null,
            };
          }),
        },
      };
    }

    // Buscar inscrição do aluno no edital
    const vagaIds = vagas.map((vaga) => vaga.id);
    const inscricoes = await this.inscricaoRepository.find({
      where: {
        aluno: { aluno_id: alunoId },
        vagas: { id: vagaIds[0] },
      },
      relations: ['respostas', 'respostas.pergunta', 'respostas.pergunta.step'],
    });

    // Buscar todas as respostas do aluno para as perguntas deste step
    const respostas = inscricoes.flatMap((inscricao) => inscricao.respostas);

    // Criar um mapa de perguntaId -> resposta para facilitar a busca
    const respostasMap = new Map<number, Resposta>();
    respostas.forEach((resposta) => {
      if (resposta.pergunta?.step?.id === stepId) {
        respostasMap.set(resposta.pergunta.id, resposta);
      }
    });

    // Combinar perguntas com respostas
    const perguntasComRespostas = perguntas.map((pergunta) => {
      const perguntaDto = plainToInstance(PerguntaResponseDto, pergunta, {
        excludeExtraneousValues: true,
      });
      perguntaDto.placeholder =
        InputFormatPlaceholders[pergunta.tipo_formatacao];

      const resposta = respostasMap.get(pergunta.id);

      return {
        pergunta: perguntaDto,
        resposta: resposta
          ? {
              id: resposta.id,

              valorTexto: resposta.valorTexto,
              valorOpcoes: resposta.valorOpcoes,
              urlArquivo: resposta.urlArquivo,
              dataResposta: resposta.dataResposta,
              validada: resposta.validada,
              dataValidacao: resposta.dataValidacao,
              dataValidade: resposta.dataValidade,
            }
          : null,
      };
    });

    return {
      sucesso: true,
      dados: {
        edital: {
          id: edital.id,
          titulo: edital.titulo_edital,
          descricao: edital.descricao,
          status: edital.status_edital,
        },
        step: {
          id: step.id,
          texto: step.texto,
        },
        aluno: {
          aluno_id: aluno.aluno_id,
          nome: aluno.usuario.nome,
          email: aluno.usuario.email,
          matricula: aluno.matricula,
        },
        perguntas: perguntasComRespostas,
      },
    };
  }

  async validateResposta(respostaId: number, dto: ValidateRespostaDto) {
    const resposta = await this.respostaRepository.findOne({
      where: { id: respostaId },
      relations: ['pergunta', 'pergunta.dado', 'inscricao', 'inscricao.aluno'],
    });

    if (!resposta) {
      throw new NotFoundException('Resposta não encontrada');
    }

    // if (resposta.validada) {
    //   throw new BadRequestException('Resposta já foi validada');
    // }

    resposta.validada = dto.validada ?? false;
    resposta.invalidada = dto.invalidada ?? false;
    resposta.dataValidacao = new Date();
    resposta.dataValidade = dto.dataValidade
      ? new Date(dto.dataValidade)
      : undefined;

    // Campos de reenvio
    resposta.requerReenvio = dto.requerReenvio ?? false;

    if (dto.requerReenvio) {
      // Admin pediu reenvio: salvar parecer e prazo
      resposta.parecer = dto.parecer ?? null;
      resposta.prazoReenvio = dto.prazoReenvio
        ? new Date(dto.prazoReenvio)
        : null;
    } else {
      // Admin NÃO pediu reenvio (invalidou direto): limpar parecer e prazo antigos
      resposta.parecer = null;
      resposta.prazoReenvio = null;
    }

    const respostaAtualizada = await this.respostaRepository.save(resposta);

    if (resposta.pergunta.dado && resposta.validada) {
      const valorDadoExistente = await this.valorDadoRepository.findOne({
        where: {
          aluno: { aluno_id: resposta.inscricao.aluno.aluno_id },
          dado: { id: resposta.pergunta.dado.id },
        },
      });

      if (valorDadoExistente) {
        valorDadoExistente.valorTexto = resposta.valorTexto || '';
        valorDadoExistente.valorOpcoes = resposta.valorOpcoes || [];
        valorDadoExistente.valorArquivo = resposta.urlArquivo || '';
        await this.valorDadoRepository.save(valorDadoExistente);
      } else {
        const novoValorDado = this.valorDadoRepository.create({
          valorTexto: resposta.valorTexto || '',
          valorOpcoes: resposta.valorOpcoes || [],
          valorArquivo: resposta.urlArquivo || '',
          aluno: resposta.inscricao.aluno,
          dado: resposta.pergunta.dado,
        });
        await this.valorDadoRepository.save(novoValorDado);
      }
    }

    // Verificar status de todas as respostas da inscrição e atualizar status da inscrição
    await this.atualizarStatusInscricao(resposta.inscricao.id);

    // Buscar a inscrição atualizada para retornar o status
    const inscricaoAtualizada = await this.inscricaoRepository.findOne({
      where: { id: resposta.inscricao.id },
    });

    // Determinar mensagem adequada
    let mensagem = 'Resposta validada com sucesso';
    if (respostaAtualizada.invalidada && respostaAtualizada.requerReenvio) {
      mensagem = 'Resposta invalidada — reenvio solicitado com prazo';
    } else if (
      respostaAtualizada.invalidada &&
      !respostaAtualizada.requerReenvio
    ) {
      mensagem = 'Resposta invalidada definitivamente — reenvio não permitido';
    }

    return {
      sucesso: true,
      dados: {
        resposta: {
          id: respostaAtualizada.id,
          validada: respostaAtualizada.validada,
          invalidada: respostaAtualizada.invalidada,
          dataValidacao: respostaAtualizada.dataValidacao,
          dataValidade: respostaAtualizada.dataValidade,
          parecer: respostaAtualizada.parecer,
          prazoReenvio: respostaAtualizada.prazoReenvio,
          requerReenvio: respostaAtualizada.requerReenvio,
        },
        inscricao: {
          id: inscricaoAtualizada?.id,
          status: inscricaoAtualizada?.status_inscricao,
        },
        mensagem,
      },
    };
  }

  /**
   * Verifica todas as respostas de uma inscrição e atualiza o status.
   * Prioridade: APROVADA > REJEITADA > PENDENTE_REGULARIZACAO > EM_ANALISE
   *
   * - APROVADA: todas validadas
   * - REJEITADA: ao menos uma invalidada sem reenvio (tem prioridade)
   * - PENDENTE_REGULARIZACAO: ao menos uma com requerReenvio === true
   * - EM_ANALISE: alguma ainda não foi avaliada (validada === false && invalidada === false)
   */
  private async atualizarStatusInscricao(inscricaoId: number): Promise<void> {
    const inscricao = await this.inscricaoRepository.findOne({
      where: { id: inscricaoId },
      relations: ['respostas'],
    });

    if (
      !inscricao ||
      !inscricao.respostas ||
      inscricao.respostas.length === 0
    ) {
      return;
    }

    const respostas = inscricao.respostas;

    const todasValidadas = respostas.every((r) => r.validada === true);
    const algumaPendenteReenvio = respostas.some(
      (r) => r.requerReenvio === true,
    );
    const algumaInvalidadaSemReenvio = respostas.some(
      (r) => r.invalidada === true && r.requerReenvio === false,
    );
    const algumaNaoAvaliada = respostas.some(
      (r) => r.validada === false && r.invalidada === false,
    );

    if (todasValidadas) {
      inscricao.status_inscricao = StatusInscricao.APROVADA;
    } else if (algumaInvalidadaSemReenvio) {
      inscricao.status_inscricao = StatusInscricao.REJEITADA;
    } else if (algumaPendenteReenvio) {
      inscricao.status_inscricao = StatusInscricao.PENDENTE_REGULARIZACAO;
    } else if (algumaNaoAvaliada) {
      inscricao.status_inscricao = StatusInscricao.EM_ANALISE;
    }

    await this.inscricaoRepository.save(inscricao);
  }

  async findAllStepsComPerguntasRespostas(alunoId: number, editalId: number) {
    // Validar edital
    const edital = await this.editalRepository.findOne({
      where: { id: editalId },
    });
    if (!edital) throw new NotFoundException('Edital não encontrado');

    // Validar aluno
    const aluno = await this.alunoRepository.findOne({
      where: { aluno_id: alunoId },
      relations: ['usuario'],
    });
    if (!aluno) throw new NotFoundException('Aluno não encontrado');

    // Buscar todos os steps do edital
    const steps = await this.stepRepository.find({
      where: { edital: { id: editalId } },
      order: { id: 'ASC' },
    });

    if (!steps || steps.length === 0) {
      return {
        sucesso: true,
        dados: {
          edital: {
            id: edital.id,
            titulo: edital.titulo_edital,
            descricao: edital.descricao,
            status: edital.status_edital,
          },
          aluno: {
            aluno_id: aluno.aluno_id,
            nome: aluno.usuario.nome,
            email: aluno.usuario.email,
            matricula: aluno.matricula,
          },
          steps: [],
        },
      };
    }

    // Buscar vagas do edital
    const vagas = await this.vagasRepository.find({
      where: { edital: { id: editalId } },
    });

    // Buscar inscrição do aluno no edital (se houver vagas)
    let respostasMap = new Map<number, Resposta>();
    let inscricaoAtual: Inscricao | null = null;
    if (vagas && vagas.length > 0) {
      const vagaIds = vagas.map((vaga) => vaga.id);
      const inscricoes = await this.inscricaoRepository.find({
        where: {
          aluno: { aluno_id: alunoId },
          vagas: { id: vagaIds[0] },
        },
        relations: [
          'respostas',
          'respostas.pergunta',
          'respostas.pergunta.step',
        ],
      });

      inscricaoAtual = inscricoes.length > 0 ? inscricoes[0] : null;

      // Criar mapa de perguntaId -> resposta
      const respostas = inscricoes.flatMap((inscricao) => inscricao.respostas);
      respostas.forEach((resposta) => {
        if (resposta.pergunta) {
          respostasMap.set(resposta.pergunta.id, resposta);
        }
      });
    }

    // Processar cada step
    const stepsComDados = await Promise.all(
      steps.map(async (step) => {
        // Buscar perguntas do step
        const perguntas = await this.perguntaRepository.find({
          where: { step: { id: step.id } },
          relations: ['dado'],
          order: { id: 'ASC' },
        });

        // Combinar perguntas com respostas
        const perguntasComRespostas = perguntas.map((pergunta) => {
          const perguntaDto = plainToInstance(PerguntaResponseDto, pergunta, {
            excludeExtraneousValues: true,
          });
          perguntaDto.placeholder =
            InputFormatPlaceholders[pergunta.tipo_formatacao];

          const resposta = respostasMap.get(pergunta.id);

          return {
            pergunta: perguntaDto,
            resposta: resposta
              ? {
                  id: resposta.id,
                  valorTexto: resposta.valorTexto,
                  valorOpcoes: resposta.valorOpcoes,
                  urlArquivo: resposta.urlArquivo,
                  dataResposta: resposta.dataResposta,
                  validada: resposta.validada,
                  invalidada: resposta.invalidada,
                  dataValidacao: resposta.dataValidacao,
                  dataValidade: resposta.dataValidade,
                  parecer: resposta.parecer,
                  prazoReenvio: resposta.prazoReenvio,
                  requerReenvio: resposta.requerReenvio,
                }
              : null,
          };
        });

        // Calcular status do step baseado nas respostas
        // CONCLUIDO: todas validadas
        // PENDENTE_REGULARIZACAO: ao menos uma com requerReenvio
        // REJEITADO: ao menos uma invalidada sem reenvio
        // EM_ANDAMENTO: alguma ainda não avaliada
        let statusStep:
          | 'CONCLUIDO'
          | 'EM_ANDAMENTO'
          | 'PENDENTE_REGULARIZACAO'
          | 'REJEITADO' = 'EM_ANDAMENTO';

        if (perguntas.length > 0) {
          const todasValidadas = perguntasComRespostas.every(
            (pr) => pr.resposta !== null && pr.resposta.validada === true,
          );
          const algumaPendenteReenvio = perguntasComRespostas.some(
            (pr) => pr.resposta !== null && pr.resposta.requerReenvio === true,
          );
          const algumaInvalidadaSemReenvio = perguntasComRespostas.some(
            (pr) =>
              pr.resposta !== null &&
              pr.resposta.invalidada === true &&
              pr.resposta.requerReenvio === false,
          );

          if (todasValidadas) {
            statusStep = 'CONCLUIDO';
          } else if (algumaPendenteReenvio) {
            statusStep = 'PENDENTE_REGULARIZACAO';
          } else if (algumaInvalidadaSemReenvio) {
            statusStep = 'REJEITADO';
          } else {
            statusStep = 'EM_ANDAMENTO';
          }
        }

        return {
          step: {
            id: step.id,
            texto: step.texto,
          },
          status: statusStep,
          perguntas: perguntasComRespostas,
        };
      }),
    );

    return {
      sucesso: true,
      dados: {
        edital: {
          id: edital.id,
          titulo: edital.titulo_edital,
          descricao: edital.descricao,
          status: edital.status_edital,
        },
        aluno: {
          aluno_id: aluno.aluno_id,
          nome: aluno.usuario.nome,
          email: aluno.usuario.email,
          matricula: aluno.matricula,
        },
        inscricao: inscricaoAtual
          ? {
              id: inscricaoAtual.id,
              status: inscricaoAtual.status_inscricao,
            }
          : null,
        steps: stepsComDados,
      },
    };
  }
}
