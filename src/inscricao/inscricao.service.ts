import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { EntityManager, Repository } from 'typeorm';
import { Aluno } from '../entities/aluno/aluno.entity';
import { Documento } from '../entities/documento/documento.entity';
import { Edital } from '../entities/edital/edital.entity';
import { Pergunta } from '../entities/pergunta/pergunta.entity';
import { Inscricao } from '../entities/inscricao/inscricao.entity';
import { Resposta } from '../entities/inscricao/resposta.entity';
import { StatusEdital } from '../enum/enumStatusEdital';
import { StatusDocumento } from '../enum/statusDocumento';
import { CreateInscricaoDto } from './dto/create-inscricao-dto';
import { InscricaoResponseDto } from './dto/response-inscricao.dto';
import { UpdateInscricaoDto } from './dto/update-inscricao-dto';
import { AuthGuard } from '../auth/auth.guard';

export class InscricaoService {
  constructor(
    @InjectRepository(Inscricao)
    private readonly inscricaoRepository: Repository<Inscricao>,
    @InjectRepository(Aluno)
    private readonly alunoRepository: Repository<Aluno>,
    @InjectRepository(Edital)
    private readonly editalRepository: Repository<Edital>,
    @InjectRepository(Pergunta)
    private readonly perguntaRepository: Repository<Pergunta>,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async createInscricao(
    createInscricaoDto: CreateInscricaoDto,
  ): Promise<InscricaoResponseDto> {
    try {
      const alunoExists = await this.alunoRepository.findOneBy({
        aluno_id: AuthGuard.getUserId(),
      });

      if (!alunoExists) {
        throw new NotFoundException('Aluno não encontrado');
      }

      // Validação do edital
      const editalExiste = await this.editalRepository.findOne({
        where: { id: createInscricaoDto.edital },
      });

      if (!editalExiste) {
        throw new NotFoundException('Edital não encontrado');
      }

      // Validação do status do edital
      if (editalExiste.status_edital !== StatusEdital.ABERTO) {
        throw new BadRequestException('Edital não está aberto para inscrições');
      }

      // Busca todas as perguntas do edital
      const perguntas = await this.perguntaRepository.find({
        where: {
          step: {
            edital: { id: editalExiste.id },
          },
        },
      });

      // Cria um mapa de perguntas por ID para fácil acesso
      const perguntasMap = new Map(perguntas.map((p) => [p.id, p]));

      // Validação das respostas
      if (
        !createInscricaoDto.respostas ||
        !createInscricaoDto.respostas.length
      ) {
        throw new BadRequestException(
          'É necessário fornecer respostas para as perguntas do edital',
        );
      }

      // Valida e associa as perguntas às respostas
      const respostas = await Promise.all(
        createInscricaoDto.respostas.map(async (respostaDto) => {
          const pergunta = perguntasMap.get(respostaDto.pergunta_id);

          if (!pergunta) {
            throw new NotFoundException(
              `Pergunta com ID ${respostaDto.pergunta_id} não encontrada no edital`,
            );
          }

          if (!respostaDto.texto || respostaDto.texto.trim() === '') {
            throw new BadRequestException(
              `Resposta para a pergunta ${pergunta.pergunta} não pode estar vazia`,
            );
          }

          return new Resposta({
            pergunta,
            texto: respostaDto.texto,
          });
        }),
      );

      const inscricao = new Inscricao({
        aluno: alunoExists,
        // TODO: Vincular com vagas ao invés de edital diretamente
        respostas,
      });

      const result = await this.entityManager.transaction(
        async (transactionalEntityManager) => {
          // Salva a inscrição com as respostas em cascade
          const inscricaoSalva =
            await transactionalEntityManager.save(inscricao);

          // TODO: Recriar lógica de documentos após implementar relacionamento com vagas
          /*
          if (
            editalExiste.tipo_documentos &&
            editalExiste.tipo_documentos.length > 0
          ) {
            for (const tipo_documento of editalExiste.tipo_documentos) {
              const documento = new Documento({
                tipo_documento: tipo_documento,
                inscricao: inscricaoSalva,
              });
              await transactionalEntityManager.save(documento);
            }
          }
          */

          return inscricaoSalva;
        },
      );

      return plainToInstance(InscricaoResponseDto, result, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      console.error('Falha ao submeter uma inscrição', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Ocorreu um erro ao processar sua inscrição. Por favor, tente novamente mais tarde.',
      );
    }
  }

  async updateInscricao(
    inscricaoId: number,
    updateInscricaoDto: UpdateInscricaoDto,
  ): Promise<InscricaoResponseDto> {
    try {
      // Validação da inscrição
      const inscricaoExistente = await this.inscricaoRepository.findOne({
        where: { id: inscricaoId },
        relations: ['aluno', 'edital', 'respostas'],
      });

      if (!inscricaoExistente) {
        throw new NotFoundException('Inscrição não encontrada');
      }

      const alunoExists = await this.alunoRepository.findOneBy({
        aluno_id: AuthGuard.getUserId(),
      });

      if (!alunoExists) {
        throw new NotFoundException('Aluno não encontrado');
      }

      // Validação do edital
      const editalExiste = await this.editalRepository.findOne({
        where: { id: updateInscricaoDto.edital },
      });

      if (!editalExiste) {
        throw new NotFoundException('Edital não encontrado');
      }

      // Validação do status do edital
      if (editalExiste.status_edital !== StatusEdital.ABERTO) {
        throw new BadRequestException(
          'Edital não está aberto para atualizações',
        );
      }

      // Validação das respostas
      if (
        updateInscricaoDto.respostas &&
        updateInscricaoDto.respostas.length &&
        updateInscricaoDto.respostas_editadas &&
        updateInscricaoDto.respostas_editadas.length
      ) {
        // Busca todas as perguntas do edital
        const perguntas = await this.perguntaRepository.find({
          where: {
            step: {
              edital: { id: editalExiste.id },
            },
          },
        });

        // Cria um mapa de perguntas por ID para fácil acesso
        const perguntasMap = new Map(perguntas.map((p) => [p.id, p]));

        // Valida e associa as respostas
        const respostas = await Promise.all(
          // cria as novas respostas
          updateInscricaoDto.respostas.map(async (respostaDto) => {
            const pergunta = perguntasMap.get(respostaDto.pergunta_id);

            if (!pergunta) {
              throw new NotFoundException(
                `Pergunta com ID ${respostaDto.pergunta_id} não encontrada no edital`,
              );
            }

            if (!respostaDto.texto || respostaDto.texto.trim() === '') {
              throw new BadRequestException(
                `Resposta para a pergunta ${pergunta.pergunta} não pode estar vazia`,
              );
            }

            return new Resposta({
              pergunta,
              texto: respostaDto.texto,
            });
          }),
        );

        // atualiza as respostas existentes
        const respostasAtualizadas = await Promise.all(
          updateInscricaoDto.respostas_editadas.map(async (respostaDto) => {
            if (typeof respostaDto.pergunta_id !== 'number') {
              throw new BadRequestException('ID da pergunta inválido');
            }

            const pergunta = perguntasMap.get(respostaDto.pergunta_id);
            if (!pergunta) {
              throw new NotFoundException(
                `Pergunta com ID ${respostaDto.pergunta_id} não encontrada no edital`,
              );
            }

            if (!respostaDto.texto || respostaDto.texto.trim() === '') {
              throw new BadRequestException(
                `Resposta para a pergunta ${pergunta.pergunta} não pode estar vazia`,
              );
            }

            const respostaExistente = inscricaoExistente.respostas.find(
              (r) => r.id === respostaDto.id,
            );
            if (!respostaExistente) {
              throw new NotFoundException(
                `Resposta com ID ${respostaDto.id} não encontrada na inscrição`,
              );
            }

            Object.assign(respostaExistente, {
              texto: respostaDto.texto,
            });

            return respostaExistente;
          }),
        );

        // Atualiza as respostas existentes
        inscricaoExistente.respostas = [...respostas, ...respostasAtualizadas];
      }

      // Atualiza os dados básicos da inscrição
      Object.assign(inscricaoExistente, {
        aluno: alunoExists,
        edital: editalExiste,
        data_inscricao: updateInscricaoDto.data_inscricao,
        status_inscricao: updateInscricaoDto.status_inscricao,
      });

      const result = await this.entityManager.transaction(
        async (transactionalEntityManager) => {
          // Salva a inscrição atualizada
          const inscricaoAtualizada =
            await transactionalEntityManager.save(inscricaoExistente);

          return inscricaoAtualizada;
        },
      );

      return plainToInstance(InscricaoResponseDto, result, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      console.error('Falha ao atualizar a inscrição', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Ocorreu um erro ao processar a atualização da inscrição. Por favor, tente novamente mais tarde.',
      );
    }
  }

  async getInscricoesByAluno(userId: number) {
    try {
      const aluno = await this.alunoRepository.findOne({
        where: { aluno_id: userId },
      });

      if (!aluno) {
        throw new NotFoundException('Aluno não encontrado');
      }

      const inscricoes = await this.inscricaoRepository.find({
        where: {
          aluno: { aluno_id: aluno.aluno_id },
          documentos: {
            status_documento: StatusDocumento.PENDENTE,
          },
        },
        relations: ['documentos', 'documentos.validacoes'],
      });

      return inscricoes
        .map((inscricao) => ({
          titulo_edital: 'TODO: Buscar via vagas',
          tipo_edital: ['TODO: Buscar via vagas'],
          documentos: inscricao.documentos
            .filter(
              (documento) =>
                documento.status_documento === StatusDocumento.PENDENTE,
            )
            .map((documento) => {
              // Pegar a validação mais recente (se houver)
              const validacaoMaisRecente =
                documento.validacoes && documento.validacoes.length > 0
                  ? documento.validacoes.sort(
                      (a, b) =>
                        new Date(b.data_validacao || 0).getTime() -
                        new Date(a.data_validacao || 0).getTime(),
                    )[0]
                  : null;

              return {
                tipo_documento: documento.tipo_documento,
                status_documento: documento.status_documento,
                documento_url: documento.documento_url,
                parecer: validacaoMaisRecente?.parecer || null,
                data_validacao: validacaoMaisRecente?.data_validacao || null,
              };
            }),
        }))
        .filter((inscricao) => inscricao.documentos.length > 0);
    } catch (error) {
      const e = error as Error;
      console.error(
        'Falha ao buscar inscrições com pendências do aluno',
        error,
      );

      // Preserva o tipo original da exceção se for NotFoundException
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new BadRequestException(
        `Falha ao buscar inscrições com pendências do aluno: ${e.message}`,
      );
    }
  }
}
