import {
  Injectable,
  Inject,
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
import { Aluno } from '../entities/aluno/aluno.entity';
import { Usuario } from '../entities/usuarios/usuario.entity';
import { Step } from '../entities/step/step.entity';
import { Edital } from '../entities/edital/edital.entity';
import { Vagas } from '../entities/vagas/vagas.entity';
import { ValorDado } from '../entities/valorDado/valorDado.entity';
import { Dado } from '../entities/tipoDado/tipoDado.entity';
import { InputFormatPlaceholders } from '../core/shared-kernel/enums/enumInputFormat';
import { PerguntaResponseDto } from '../step/dto/response-pergunta.dto';
import {
  CreateRespostaUseCase,
  FindAllRespostasUseCase,
  FindRespostaByIdUseCase,
  UpdateRespostaUseCase,
  RemoveRespostaUseCase,
  FindRespostasAlunoEditalUseCase,
  FindRespostasAlunoStepUseCase,
  FindPerguntasComRespostasAlunoStepUseCase,
  FindRespostasPerguntaEditalUseCase,
  ValidateRespostaUseCase,
} from '../core/application/resposta';
import {
  FILE_STORAGE,
  type FileStoragePort,
} from '../core/application/utilities';

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
    @Inject(FILE_STORAGE)
    private readonly minioService: FileStoragePort,
    private readonly createRespostaUseCase: CreateRespostaUseCase,
    private readonly findAllRespostasUseCase: FindAllRespostasUseCase,
    private readonly findRespostaByIdUseCase: FindRespostaByIdUseCase,
    private readonly updateRespostaUseCase: UpdateRespostaUseCase,
    private readonly removeRespostaUseCase: RemoveRespostaUseCase,
    private readonly findRespostasAlunoEditalUseCase: FindRespostasAlunoEditalUseCase,
    private readonly findRespostasAlunoStepUseCase: FindRespostasAlunoStepUseCase,
    private readonly findPerguntasComRespostasAlunoStepUseCase: FindPerguntasComRespostasAlunoStepUseCase,
    private readonly findRespostasPerguntaEditalUseCase: FindRespostasPerguntaEditalUseCase,
    private readonly validateRespostaUseCase: ValidateRespostaUseCase,
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

    const saved = await this.createRespostaUseCase.execute({
      perguntaId: pergunta.id,
      inscricaoId: inscricao.id,
      valorTexto: dto.valorTexto,
      valorOpcoes: dto.valorOpcoes,
      urlArquivo: urlArquivo || dto.urlArquivo,
      texto: dto.valorTexto,
    });

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
    const respostas = await this.findAllRespostasUseCase.execute();

    return respostas.map((r) =>
      plainToInstance(
        RespostaResponseDto,
        { ...r, perguntaId: r.perguntaId, inscricaoId: r.inscricaoId },
        { excludeExtraneousValues: true },
      ),
    );
  }

  async findOne(id: number): Promise<RespostaResponseDto> {
    const resposta = await this.findRespostaByIdUseCase.execute(id);

    return plainToInstance(
      RespostaResponseDto,
      {
        ...resposta,
        perguntaId: resposta.perguntaId,
        inscricaoId: resposta.inscricaoId,
      },
      { excludeExtraneousValues: true },
    );
  }

  async update(
    id: number,
    dto: UpdateRespostaDto,
  ): Promise<RespostaResponseDto> {
    const updated = await this.updateRespostaUseCase.execute(id, {
      valorTexto: dto.valorTexto,
      valorOpcoes: dto.valorOpcoes,
      urlArquivo: dto.urlArquivo,
      texto: dto.valorTexto,
    });

    return plainToInstance(RespostaResponseDto, updated, {
      excludeExtraneousValues: true,
    });
  }

  async remove(id: number): Promise<void> {
    await this.removeRespostaUseCase.execute(id);
  }

  async findRespostasAlunoEdital(alunoId: number, editalId: number) {
    return this.findRespostasAlunoEditalUseCase.execute(alunoId, editalId);
  }

  async findRespostasAlunoStep(
    alunoId: number,
    editalId: number,
    stepId: number,
  ) {
    return this.findRespostasAlunoStepUseCase.execute(alunoId, editalId, stepId);
  }

  async findRespostasPerguntaEdital(perguntaId: number, editalId: number) {
    return this.findRespostasPerguntaEditalUseCase.execute(perguntaId, editalId);
  }

  async findPerguntasComRespostasAlunoStep(
    alunoId: number,
    editalId: number,
    stepId: number,
  ) {
    return this.findPerguntasComRespostasAlunoStepUseCase.execute(
      alunoId,
      editalId,
      stepId,
    );
  }

  async validateResposta(respostaId: number, dto: ValidateRespostaDto) {
    return this.validateRespostaUseCase.execute(respostaId, {
      validada: dto.validada,
      dataValidade: dto.dataValidade,
    });
  }
}
