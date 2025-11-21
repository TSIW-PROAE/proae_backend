import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { Inscricao } from '../entities/inscricao/inscricao.entity';
import { StatusDocumento } from '../enum/statusDocumento';
import { AtualizaDadosAlunoDTO } from './dto/atualizaDadosAluno';
import { Usuario } from '../entities/usuarios/usuario.entity';
import { Step } from '../entities/step/step.entity';
import { Edital } from '../entities/edital/edital.entity';
import { Vagas } from '../entities/vagas/vagas.entity';

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
  async findByUserId(userId: number) {
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
  async hasReprovadoDocuments(userId: number): Promise<boolean> {
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
    userId: number,
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
  async checkUpdatePermission(userId: number) {
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
  async getStudentRegistration(userId: number) {
    const usuario = await this.usuarioRepository.findOne({
      where: { usuario_id: userId },
      relations: ['aluno', 'aluno.inscricoes', 'aluno.inscricoes.documentos'],
    });

    if (!usuario || !usuario.aluno) {
      throw new NotFoundException('Aluno não encontrado.');
    }

    const inscricoes = usuario.aluno.inscricoes || [];

    return inscricoes.map((inscricao: Inscricao) => ({
      edital_id: 0, // TODO: Buscar via vagas
      inscricao_id: inscricao.id,
      titulo_edital: 'TODO: Buscar via vagas',
      status_edital: 'TODO: Buscar via vagas',
      etapas_edital: [], // TODO: Buscar via vagas
      status_inscricao: inscricao.status_inscricao,
      possui_pendencias: false, // TODO: Reimplementar verificação real
    }));
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
            resposta_texto: resposta.texto,
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
