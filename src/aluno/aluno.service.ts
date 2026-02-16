import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import type { EntityManager, Repository } from 'typeorm';
import { Inscricao } from '../entities/inscricao/inscricao.entity';
import { StatusDocumento } from '../enum/statusDocumento';
import { StatusInscricao } from '../enum/enumStatusInscricao';
import { AtualizaDadosAlunoDTO } from './dto/atualizaDadosAluno';
import { Usuario } from '../entities/usuarios/usuario.entity';
import { Step } from '../entities/step/step.entity';
import { Edital } from '../entities/edital/edital.entity';
import { Vagas } from '../entities/vagas/vagas.entity';
import { checkPendenciasExpiradas } from '../common/helpers/check-pendencias-expiradas';

@Injectable()
export class AlunoService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(Step)
    private readonly stepRepository: Repository<Step>,
    @InjectRepository(Edital)
    private readonly editalRepository: Repository<Edital>,
    @InjectRepository(Vagas)
    private readonly vagasRepository: Repository<Vagas>,
    @InjectRepository(Inscricao)
    private readonly inscricaoRepository: Repository<Inscricao>,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async findUsers() {
    const usuarios = await this.usuarioRepository.find({
      relations: ['aluno', 'aluno.inscricoes'],
    });

    if (!usuarios || usuarios.length === 0) {
      throw new NotFoundException('Alunos não encontrados.');
    }

    const dados = usuarios.map((usuario) => {
      const aluno = usuario.aluno;

      return {
        aluno_id: aluno?.aluno_id,
        email: usuario.email,
        matricula: aluno?.matricula,
        data_nascimento: usuario.data_nascimento,
        curso: aluno?.curso,
        campus: aluno?.campus,
        cpf: usuario.cpf,
        data_ingresso: aluno?.data_ingresso,
        celular: usuario.celular,
        inscricoes: aluno?.inscricoes || [],
      };
    });
    return {
      sucesso: true,
      dados,
    };
  }
  /** Buscar aluno pelo userId */
  async findByUserId(userId: string) {
    const usuario = await this.usuarioRepository.findOne({
      where: { usuario_id: userId },
      relations: ['aluno', 'aluno.inscricoes'],
    });

    if (!usuario || !usuario.aluno) {
      throw new NotFoundException('Aluno não encontrado');
    }

    const aluno = usuario.aluno;

    return {
      sucesso: true,
      dados: {
        aluno: {
          aluno_id: aluno.aluno_id,
          email: usuario.email,
          matricula: aluno.matricula,
          data_nascimento: usuario.data_nascimento,
          curso: aluno.curso,
          campus: aluno.campus,
          cpf: usuario.cpf,
          data_ingresso: aluno.data_ingresso,
          celular: usuario.celular,
          inscricoes: aluno.inscricoes,
        },
      },
    };
  }

  /** Verificar se o aluno possui documentos reprovados */
  async hasReprovadoDocuments(userId: string): Promise<boolean> {
    const usuario = await this.usuarioRepository.findOne({
      where: { usuario_id: userId },
      relations: ['aluno', 'aluno.inscricoes', 'aluno.inscricoes.documentos'],
    });

    if (!usuario || !usuario.aluno) return false;

    for (const inscricao of usuario.aluno.inscricoes) {
      if (
        inscricao.documentos.some(
          (doc) => doc.status_documento === StatusDocumento.REPROVADO,
        )
      ) {
        return true;
      }
    }

    return false;
  }

  /** Atualizar dados do aluno */
  async updateStudentData(
    userId: string,
    atualizaDadosAlunoDTO: AtualizaDadosAlunoDTO,
  ) {
    const usuario = await this.usuarioRepository.findOne({
      where: { usuario_id: userId },
      relations: ['aluno'],
    });

    if (!usuario || !usuario.aluno) {
      throw new NotFoundException('Aluno não encontrado.');
    }

    // Verificar se há dados para atualizar
    const hasAnyData = Object.values(atualizaDadosAlunoDTO).some(
      (value) => value !== undefined && value !== null && value !== '',
    );

    if (!hasAnyData) {
      throw new BadRequestException('Dados para atualização não fornecidos.');
    }

    // Verificar se o email já existe
    if (
      atualizaDadosAlunoDTO.email &&
      atualizaDadosAlunoDTO.email !== usuario.email
    ) {
      const emailExistente = await this.usuarioRepository.findOne({
        where: { email: atualizaDadosAlunoDTO.email },
      });
      if (emailExistente) {
        throw new BadRequestException('Email já está em uso.');
      }
      usuario.email = atualizaDadosAlunoDTO.email;
    }

    // Atualizar dados do Aluno
    Object.assign(usuario.aluno, {
      matricula: atualizaDadosAlunoDTO.matricula || usuario.aluno.matricula,
      curso: atualizaDadosAlunoDTO.curso || usuario.aluno.curso,
      campus: atualizaDadosAlunoDTO.campus || usuario.aluno.campus,
      data_ingresso:
        atualizaDadosAlunoDTO.data_ingresso || usuario.aluno.data_ingresso,
    });

    // Atualizar dados do usuário (celular, se existir)
    if (atualizaDadosAlunoDTO.celular) {
      usuario.celular = atualizaDadosAlunoDTO.celular;
    }

    await this.usuarioRepository.save(usuario); // salva Usuario + Aluno via cascade

    return {
      success: true,
      message: 'Dados do aluno atualizados com sucesso!',
    };
  }

  /** Verificar permissão para atualizar dados */
  async checkUpdatePermission(userId: string) {
    const hasPermission = await this.hasReprovadoDocuments(userId);

    return {
      success: true,
      canUpdate: hasPermission,
      message: hasPermission
        ? 'Você pode editar seus dados para reenvio'
        : 'Você não possui documentos reprovados. Edição de dados não permitida.',
    };
  }

  /** Retornar inscrições do aluno */
  async getStudentRegistration(userId: string) {
    // Checar pendências expiradas antes de retornar os dados
    await checkPendenciasExpiradas(this.entityManager);

    const usuario = await this.usuarioRepository.findOne({
      where: { usuario_id: userId },
      relations: [
        'aluno',
        'aluno.inscricoes',
        'aluno.inscricoes.vagas',
        'aluno.inscricoes.vagas.edital',
        'aluno.inscricoes.documentos',
        'aluno.inscricoes.respostas',
        'aluno.inscricoes.respostas.pergunta',
        'aluno.inscricoes.respostas.pergunta.step',
      ],
    });

    if (!usuario || !usuario.aluno) {
      throw new NotFoundException('Aluno não encontrado.');
    }

    const inscricoes = usuario.aluno.inscricoes || [];

    return inscricoes.map((inscricao: Inscricao) => {
      const edital = inscricao.vagas?.edital;
      const vaga = inscricao.vagas;

      // Montar pendências agrupadas por step quando status é PENDENTE_REGULARIZACAO
      let pendencias_por_step: {
        step_id: number;
        step_texto: string;
        perguntas_pendentes: {
          pergunta_id: number;
          pergunta_texto: string;
          resposta_id: number;
          resposta_texto: string | null;
          parecer: string | null;
          prazo_reenvio: Date | null;
        }[];
        total_pendentes: number;
      }[] = [];
      let total_pendencias = 0;

      if (
        inscricao.status_inscricao === StatusInscricao.PENDENTE_REGULARIZACAO
      ) {
        const respostasPendentes = (inscricao.respostas || []).filter(
          (r) => r.invalidada === true || r.requerReenvio === true,
        );

        const stepMap = new Map<
          number,
          {
            step_id: number;
            step_texto: string;
            perguntas_pendentes: {
              pergunta_id: number;
              pergunta_texto: string;
              resposta_id: number;
              resposta_texto: string | null;
              parecer: string | null;
              prazo_reenvio: Date | null;
            }[];
          }
        >();

        for (const resposta of respostasPendentes) {
          const step = resposta.pergunta?.step;
          if (!step) continue;

          if (!stepMap.has(step.id)) {
            stepMap.set(step.id, {
              step_id: step.id,
              step_texto: step.texto,
              perguntas_pendentes: [],
            });
          }

          stepMap.get(step.id)!.perguntas_pendentes.push({
            pergunta_id: resposta.pergunta.id,
            pergunta_texto: resposta.pergunta.pergunta,
            resposta_id: resposta.id,
            resposta_texto: resposta.valorTexto || null,
            parecer: resposta.parecer || null,
            prazo_reenvio: resposta.prazoReenvio || null,
          });
        }

        pendencias_por_step = Array.from(stepMap.values()).map((step) => ({
          ...step,
          total_pendentes: step.perguntas_pendentes.length,
        }));

        total_pendencias = respostasPendentes.length;
      }

      // Flag: inscrição rejeitada por perda de prazo de reenvio
      let rejeitada_por_prazo = false;
      if (inscricao.status_inscricao === StatusInscricao.REJEITADA) {
        rejeitada_por_prazo = (inscricao.respostas || []).some(
          (r) =>
            r.invalidada === true &&
            r.requerReenvio === false &&
            r.prazoReenvio !== null &&
            r.prazoReenvio !== undefined,
        );
      }

      return {
        edital_id: edital?.id || null,
        inscricao_id: inscricao.id,
        titulo_edital: edital?.titulo_edital || null,
        status_edital: edital?.status_edital || null,
        etapa_edital: edital?.etapa_edital || null,
        status_inscricao: inscricao.status_inscricao,
        data_inscricao: inscricao.data_inscricao,
        vaga: vaga
          ? {
              vaga_id: vaga.id,
              beneficio: vaga.beneficio,
              descricao_beneficio: vaga.descricao_beneficio,
              numero_vagas: vaga.numero_vagas,
            }
          : null,
        rejeitada_por_prazo,
        possui_pendencias: total_pendencias > 0,
        total_pendencias,
        ...(inscricao.status_inscricao ===
        StatusInscricao.PENDENTE_REGULARIZACAO
          ? { pendencias_por_step }
          : {}),
      };
    });
  }

  async findAlunosInscritosEmStep(editalId: number, stepId: number) {
    const edital = await this.editalRepository.findOne({
      where: { id: editalId },
      relations: ['steps'],
    });

    if (!edital) {
      throw new NotFoundException(`Edital com ID ${editalId} não encontrado.`);
    }

    const step = await this.stepRepository.findOne({
      where: { id: stepId, edital: { id: editalId } },
      relations: ['edital'],
    });

    if (!step) {
      throw new NotFoundException(
        `Step com ID ${stepId} não encontrado no edital ${editalId}.`,
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
    const inscricoes = await this.inscricaoRepository
      .createQueryBuilder('inscricao')
      .leftJoinAndSelect('inscricao.aluno', 'aluno')
      .leftJoinAndSelect('aluno.usuario', 'usuario')
      .leftJoinAndSelect('inscricao.vagas', 'vagas')
      .leftJoinAndSelect('vagas.edital', 'edital')
      .leftJoinAndSelect('inscricao.respostas', 'respostas')
      .leftJoinAndSelect('respostas.pergunta', 'pergunta')
      .leftJoinAndSelect('pergunta.step', 'step')
      .where('vagas.id IN (:...vagaIds)', { vagaIds })
      .getMany();

    const inscricoesComRespostas = inscricoes.filter((inscricao) => {
      return inscricao.respostas.some((resposta) => {
        return resposta.pergunta.step.id === stepId;
      });
    });

    const alunosInscritos = inscricoesComRespostas.map((inscricao) => {
      const aluno = inscricao.aluno;
      const usuario = aluno.usuario;

      return {
        aluno_id: aluno.aluno_id,
        usuario_id: usuario.usuario_id,
        email: usuario.email,
        nome: usuario.nome,
        matricula: aluno.matricula,
        cpf: usuario.cpf,
        celular: usuario.celular,
        curso: aluno.curso,
        campus: aluno.campus,
        data_nascimento: usuario.data_nascimento,
        data_ingresso: aluno.data_ingresso,
        inscricao_id: inscricao.id,
        status_inscricao: inscricao.status_inscricao,
        data_inscricao: inscricao.data_inscricao,
        respostas_step: inscricao.respostas
          .filter((resposta) => resposta.pergunta.step.id === stepId)
          .map((resposta) => ({
            pergunta_id: resposta.pergunta.id,
            pergunta_texto: resposta.pergunta.pergunta,
            resposta_texto: resposta.valorTexto,
            data_resposta: resposta.dataResposta,
          })),
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
        total_alunos: alunosInscritos.length,
        alunos: alunosInscritos,
      },
    };
  }
}
