import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { Resposta } from '../../../../entities/resposta/resposta.entity';
import { Pergunta } from '../../../../entities/pergunta/pergunta.entity';
import { Inscricao } from '../../../../entities/inscricao/inscricao.entity';
import { Aluno } from '../../../../entities/aluno/aluno.entity';
import { Usuario } from '../../../../entities/usuarios/usuario.entity';
import { Step } from '../../../../entities/step/step.entity';
import { Edital } from '../../../../entities/edital/edital.entity';
import { Vagas } from '../../../../entities/vagas/vagas.entity';
import { ValorDado } from '../../../../entities/valorDado/valorDado.entity';
import { InputFormatPlaceholders } from '../../../../core/shared-kernel/enums/enumInputFormat';
import type {
  IRespostaRepository,
  RespostaConsultaResultado,
  RespostaData,
  ValidateRespostaCommand,
} from '../../../../core/domain/resposta';
import { plainToInstance } from 'class-transformer';
import { PerguntaResponseDto } from '../../../../step/dto/response-pergunta.dto';

@Injectable()
export class RespostaTypeOrmRepository implements IRespostaRepository {
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
  ) {}

  async create(
    data: Omit<RespostaData, 'id' | 'dataResposta' | 'validada'>,
  ): Promise<RespostaData> {
    const entity = this.respostaRepository.create({
      pergunta: { id: data.perguntaId } as any,
      inscricao: { id: data.inscricaoId } as any,
      valorTexto: data.valorTexto ?? undefined,
      valorOpcoes: data.valorOpcoes ?? [],
      urlArquivo: data.urlArquivo ?? undefined,
      texto: data.texto ?? undefined,
      validada: false,
      dataValidacao: data.dataValidacao ?? undefined,
      dataValidade: data.dataValidade ?? undefined,
    });
    const saved = await this.respostaRepository.save(entity);
    return this.toRespostaData(saved);
  }

  async findAll(): Promise<RespostaData[]> {
    const respostas = await this.respostaRepository.find({
      relations: ['pergunta', 'inscricao'],
    });
    return respostas.map((r) => this.toRespostaData(r));
  }

  async findOne(id: number): Promise<RespostaData | null> {
    const resposta = await this.respostaRepository.findOne({
      where: { id },
      relations: ['pergunta', 'inscricao'],
    });
    if (!resposta) return null;
    return this.toRespostaData(resposta);
  }

  async update(
    id: number,
    data: Partial<Omit<RespostaData, 'id'>>,
  ): Promise<RespostaData> {
    const resposta = await this.respostaRepository.findOne({ where: { id } });
    if (!resposta) {
      throw new Error('Resposta não encontrada');
    }

    if (data.valorTexto !== undefined) {
      resposta.valorTexto = data.valorTexto ?? undefined;
    }
    if (data.valorOpcoes !== undefined) {
      resposta.valorOpcoes = data.valorOpcoes ?? [];
    }
    if (data.urlArquivo !== undefined) {
      resposta.urlArquivo = data.urlArquivo ?? undefined;
    }
    if (data.texto !== undefined) {
      resposta.texto = data.texto ?? undefined;
    }
    if (data.validada !== undefined) {
      resposta.validada = data.validada;
    }
    if (data.dataValidacao !== undefined) {
      resposta.dataValidacao = data.dataValidacao ?? undefined;
    }
    if (data.dataValidade !== undefined) {
      resposta.dataValidade = data.dataValidade ?? undefined;
    }

    const saved = await this.respostaRepository.save(resposta);
    return this.toRespostaData(saved);
  }

  async remove(id: number): Promise<void> {
    await this.respostaRepository.delete({ id });
  }

  async findRespostasAlunoEdital(
    alunoId: number,
    editalId: number,
  ): Promise<RespostaConsultaResultado> {
    const edital = await this.editalRepository.findOne({ where: { id: editalId } });
    if (!edital) throw new NotFoundException('Edital não encontrado');

    const aluno = await this.alunoRepository.findOne({
      where: { aluno_id: alunoId },
      relations: ['usuario'],
    });
    if (!aluno) throw new NotFoundException('Aluno não encontrado');

    const vagas = await this.vagasRepository.find({ where: { edital: { id: editalId } } });
    if (!vagas.length) {
      return {
        sucesso: true,
        dados: [],
        mensagem: 'Nenhuma vaga encontrada para este edital.',
      };
    }

    const inscricoes = await this.inscricaoRepository.find({
      where: {
        aluno: { aluno_id: alunoId },
        vagas: { id: vagas[0].id },
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
          resposta_texto: resposta.texto,
          valor_texto: resposta.valorTexto,
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
  ): Promise<RespostaConsultaResultado> {
    const edital = await this.editalRepository.findOne({ where: { id: editalId } });
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

    const vagas = await this.vagasRepository.find({ where: { edital: { id: editalId } } });
    if (!vagas.length) {
      return {
        sucesso: true,
        dados: [],
        mensagem: 'Nenhuma vaga encontrada para este edital.',
      };
    }

    const inscricoes = await this.inscricaoRepository.find({
      where: {
        aluno: { aluno_id: alunoId },
        vagas: { id: vagas[0].id },
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
          resposta_texto: resposta.texto,
          valor_texto: resposta.valorTexto,
          valor_opcoes: resposta.valorOpcoes,
          url_arquivo: resposta.urlArquivo,
          data_resposta: resposta.dataResposta,
        })),
      },
    };
  }

  async findRespostasPerguntaEdital(
    perguntaId: number,
    editalId: number,
  ): Promise<RespostaConsultaResultado> {
    const edital = await this.editalRepository.findOne({ where: { id: editalId } });
    if (!edital) throw new NotFoundException('Edital não encontrado');

    const pergunta = await this.perguntaRepository.findOne({
      where: { id: perguntaId },
      relations: ['step', 'step.edital'],
    });
    if (!pergunta) throw new NotFoundException('Pergunta não encontrada');
    if (pergunta.step.edital.id !== editalId) {
      throw new NotFoundException('Pergunta não pertence ao edital especificado');
    }

    const vagas = await this.vagasRepository.find({ where: { edital: { id: editalId } } });
    if (!vagas.length) {
      return {
        sucesso: true,
        dados: [],
        mensagem: 'Nenhuma vaga encontrada para este edital.',
      };
    }

    const respostas = await this.respostaRepository.find({
      where: {
        pergunta: { id: perguntaId },
        inscricao: { vagas: { id: vagas[0].id } },
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
          resposta_texto: resposta.texto,
          valor_texto: resposta.valorTexto,
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
  ): Promise<RespostaConsultaResultado> {
    const edital = await this.editalRepository.findOne({ where: { id: editalId } });
    if (!edital) throw new NotFoundException('Edital não encontrado');

    const step = await this.stepRepository.findOne({
      where: { id: stepId, edital: { id: editalId } },
      relations: ['edital'],
    });
    if (!step) throw new NotFoundException('Step não encontrado no edital');

    const aluno = await this.alunoRepository.findOne({
      where: { aluno_id: alunoId },
      relations: ['usuario'],
    });
    if (!aluno) throw new NotFoundException('Aluno não encontrado');

    const perguntas = await this.perguntaRepository.find({
      where: { step: { id: stepId } },
      relations: ['dado'],
      order: { id: 'ASC' },
    });

    const vagas = await this.vagasRepository.find({ where: { edital: { id: editalId } } });
    if (!vagas.length) {
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
            return { pergunta: perguntaDto, resposta: null };
          }),
        },
      };
    }

    const inscricoes = await this.inscricaoRepository.find({
      where: {
        aluno: { aluno_id: alunoId },
        vagas: { id: vagas[0].id },
      },
      relations: ['respostas', 'respostas.pergunta', 'respostas.pergunta.step'],
    });
    const respostas = inscricoes.flatMap((inscricao) => inscricao.respostas);
    const respostasMap = new Map<number, Resposta>();
    respostas.forEach((resposta) => {
      if (resposta.pergunta?.step?.id === stepId) {
        respostasMap.set(resposta.pergunta.id, resposta);
      }
    });

    const perguntasComRespostas = perguntas.map((pergunta) => {
      const perguntaDto = plainToInstance(PerguntaResponseDto, pergunta, {
        excludeExtraneousValues: true,
      });
      perguntaDto.placeholder = InputFormatPlaceholders[pergunta.tipo_formatacao];
      const resposta = respostasMap.get(pergunta.id);
      return {
        pergunta: perguntaDto,
        resposta: resposta
          ? {
              id: resposta.id,
              texto: resposta.texto,
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

  async validateResposta(
    respostaId: number,
    cmd: ValidateRespostaCommand,
  ): Promise<RespostaConsultaResultado> {
    const resposta = await this.respostaRepository.findOne({
      where: { id: respostaId },
      relations: ['pergunta', 'pergunta.dado', 'inscricao', 'inscricao.aluno'],
    });
    if (!resposta) {
      throw new NotFoundException('Resposta não encontrada');
    }
    if (resposta.validada) {
      throw new BadRequestException('Resposta já foi validada');
    }

    resposta.validada = cmd.validada ?? true;
    resposta.dataValidacao = new Date();
    resposta.dataValidade = cmd.dataValidade ? new Date(cmd.dataValidade) : undefined;
    const respostaAtualizada = await this.respostaRepository.save(resposta);

    if (resposta.pergunta.dado && resposta.validada) {
      const valorDadoExistente = await this.valorDadoRepository.findOne({
        where: {
          aluno: { aluno_id: resposta.inscricao.aluno.aluno_id },
          dado: { id: resposta.pergunta.dado.id },
        },
      });

      if (valorDadoExistente) {
        valorDadoExistente.valorTexto = resposta.texto || resposta.valorTexto || '';
        valorDadoExistente.valorOpcoes = resposta.valorOpcoes || [];
        valorDadoExistente.valorArquivo = resposta.urlArquivo || '';
        await this.valorDadoRepository.save(valorDadoExistente);
      } else {
        const novoValorDado = this.valorDadoRepository.create({
          valorTexto: resposta.texto || resposta.valorTexto || '',
          valorOpcoes: resposta.valorOpcoes || [],
          valorArquivo: resposta.urlArquivo || '',
          aluno: resposta.inscricao.aluno,
          dado: resposta.pergunta.dado,
        });
        await this.valorDadoRepository.save(novoValorDado);
      }
    }

    return {
      sucesso: true,
      dados: {
        resposta: {
          id: respostaAtualizada.id,
          validada: respostaAtualizada.validada,
          dataValidacao: respostaAtualizada.dataValidacao,
          dataValidade: respostaAtualizada.dataValidade,
        },
        mensagem: 'Resposta validada com sucesso',
      },
    };
  }

  private toRespostaData(entity: Resposta): RespostaData {
    return {
      id: entity.id,
      perguntaId: entity.pergunta?.id ?? 0,
      inscricaoId: entity.inscricao?.id ?? 0,
      valorTexto: entity.valorTexto ?? null,
      valorOpcoes: entity.valorOpcoes ?? [],
      urlArquivo: entity.urlArquivo ?? null,
      texto: entity.texto ?? null,
      dataResposta: entity.dataResposta,
      validada: entity.validada,
      dataValidacao: entity.dataValidacao ?? null,
      dataValidade: entity.dataValidade ?? null,
    };
  }
}

