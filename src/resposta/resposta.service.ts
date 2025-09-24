import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resposta } from '../entities/resposta/resposta.entity';
import { Pergunta } from '../entities/pergunta/pergunta.entity';
import { Inscricao } from '../entities/inscricao/inscricao.entity';
import { CreateRespostaDto } from './dto/create-resposta.dto';
import { RespostaResponseDto } from './dto/response-resposta.dto';
import { plainToInstance } from 'class-transformer';
import { UpdateRespostaDto } from './dto/update-resposta.dto';
import { MinioClientService } from '../minio/minio.service';

@Injectable()
export class RespostaService {
  constructor(
    @InjectRepository(Resposta)
    private readonly respostaRepository: Repository<Resposta>,
    @InjectRepository(Pergunta)
    private readonly perguntaRepository: Repository<Pergunta>,
    @InjectRepository(Inscricao)
    private readonly inscricaoRepository: Repository<Inscricao>,
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
}
