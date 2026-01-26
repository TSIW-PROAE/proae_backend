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
import {
  StepRespostasResponseDto,
  PerguntaComRespostaDto,
} from './dto/step-respostas.dto';

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
    const resposta = await this.respostaRepository.findOneBy({ id });
    if (!resposta) throw new NotFoundException('Resposta não encontrada');

    Object.assign(resposta, dto);
    const updated = await this.respostaRepository.save(resposta);

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
          resposta_texto: resposta.texto,
          valor_texto: resposta.valorTexto,
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
          resposta_texto: resposta.texto,
          valor_texto: resposta.valorTexto,
          valor_opcoes: resposta.valorOpcoes,
          url_arquivo: resposta.urlArquivo,
          data_resposta: resposta.dataResposta,
        })),
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

    if (resposta.validada) {
      throw new BadRequestException('Resposta já foi validada');
    }

    resposta.validada = dto.validada ?? true;
    resposta.dataValidacao = new Date();
    resposta.dataValidade = dto.dataValidade
      ? new Date(dto.dataValidade)
      : undefined;

    const respostaAtualizada = await this.respostaRepository.save(resposta);

    if (resposta.pergunta.dado && resposta.validada) {
      const valorDadoExistente = await this.valorDadoRepository.findOne({
        where: {
          aluno: { aluno_id: resposta.inscricao.aluno.aluno_id },
          dado: { id: resposta.pergunta.dado.id },
        },
      });

      if (valorDadoExistente) {
        valorDadoExistente.valorTexto =
          resposta.texto || resposta.valorTexto || '';
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

  async findRespostasByAlunoStepEdital(
    alunoId: number,
    stepId: number,
    editalId: number,
  ): Promise<StepRespostasResponseDto> {
    // Buscar o aluno
    const aluno = await this.alunoRepository.findOne({
      where: { aluno_id: alunoId },
    });
    if (!aluno) {
      throw new NotFoundException('Aluno não encontrado');
    }

    // Buscar o step com suas perguntas
    const step = await this.stepRepository.findOne({
      where: { id: stepId },
      relations: ['edital', 'perguntas'],
    });
    if (!step) {
      throw new NotFoundException('Step não encontrado');
    }

    // Verificar se o step pertence ao edital especificado
    if (step.edital.id !== editalId) {
      throw new BadRequestException(
        'O step não pertence ao edital especificado',
      );
    }

    // Buscar a inscrição do aluno no edital
    const inscricao = await this.inscricaoRepository.findOne({
      where: {
        aluno: { aluno_id: alunoId },
        vagas: { edital: { id: editalId } },
      },
      relations: ['vagas', 'vagas.edital'],
    });

    // Buscar todas as respostas do aluno para as perguntas deste step
    let respostas: Resposta[] = [];
    if (inscricao) {
      respostas = await this.respostaRepository.find({
        where: {
          inscricao: { id: inscricao.id },
          pergunta: { step: { id: stepId } },
        },
        relations: ['pergunta'],
      });
    }

    // Mapear as respostas por perguntaId para facilitar o acesso
    const respostasMap = new Map<number, Resposta>();
    respostas.forEach((resposta) => {
      respostasMap.set(resposta.pergunta.id, resposta);
    });

    // Montar o resultado com todas as perguntas e suas respectivas respostas
    const perguntasComRespostas: PerguntaComRespostaDto[] = step.perguntas.map(
      (pergunta) => {
        const resposta = respostasMap.get(pergunta.id);

        return plainToInstance(
          PerguntaComRespostaDto,
          {
            perguntaId: pergunta.id,
            pergunta: pergunta.pergunta,
            obrigatoriedade: pergunta.obrigatoriedade,
            tipoPergunta: pergunta.tipo_Pergunta,
            opcoes: pergunta.opcoes,
            respostaId: resposta?.id,
            valorTexto: resposta?.valorTexto,
            valorOpcoes: resposta?.valorOpcoes,
            urlArquivo: resposta?.urlArquivo,
            dataResposta: resposta?.dataResposta,
            validada: resposta?.validada,
          },
          { excludeExtraneousValues: true },
        );
      },
    );

    return plainToInstance(
      StepRespostasResponseDto,
      {
        stepId: step.id,
        stepTexto: step.texto,
        editalId: editalId,
        alunoId: alunoId,
        inscricaoId: inscricao?.id,
        perguntas: perguntasComRespostas,
      },
      { excludeExtraneousValues: true },
    );
  }
}
