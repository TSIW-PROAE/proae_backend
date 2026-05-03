import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { StatusInscricao } from 'src/core/shared-kernel/enums/enumStatusInscricao';
import { Edital } from 'src/infrastructure/persistence/typeorm/entities/edital/edital.entity';
import { Vagas } from 'src/infrastructure/persistence/typeorm/entities/vagas/vagas.entity';
import { Inscricao } from 'src/infrastructure/persistence/typeorm/entities/inscricao/inscricao.entity';
import { Aluno } from 'src/infrastructure/persistence/typeorm/entities/aluno/aluno.entity';
import { Step } from 'src/infrastructure/persistence/typeorm/entities/step/step.entity';
import { Pergunta } from 'src/infrastructure/persistence/typeorm/entities/pergunta/pergunta.entity';
import { StatusEdital } from 'src/core/shared-kernel/enums/enumStatusEdital';
import { NivelAcademico } from 'src/core/shared-kernel/enums/enumNivelAcademico';
import type { CreateFormularioGeralDto } from '../formulario-geral/dto/create-formulario-geral.dto';
import type { UpdateFormularioGeralDto } from '../formulario-geral/dto/update-formulario-geral.dto';
import type { UpdateFGInscricaoStatusDto } from '../formulario-geral/dto/update-fg-inscricao-status.dto';
import { InscricaoAuditLogService } from '../inscricao-audit/inscricao-audit-log.service';

/**
 * Formulário de renovação (recadastro): fluxo paralelo ao Formulário Geral,
 * com flag `is_formulario_renovacao` no edital.
 */
@Injectable()
export class FormularioRenovacaoService {
  constructor(
    @InjectRepository(Edital)
    private readonly editalRepository: Repository<Edital>,
    @InjectRepository(Vagas)
    private readonly vagasRepository: Repository<Vagas>,
    @InjectRepository(Inscricao)
    private readonly inscricaoRepository: Repository<Inscricao>,
    @InjectRepository(Aluno)
    private readonly alunoRepository: Repository<Aluno>,
    @InjectRepository(Step)
    private readonly stepRepository: Repository<Step>,
    @InjectRepository(Pergunta)
    private readonly perguntaRepository: Repository<Pergunta>,
    private readonly inscricaoAuditLog: InscricaoAuditLogService,
  ) {}

  async findFormularioRenovacaoPorNivel(nivel: NivelAcademico) {
    const edital = await this.editalRepository.findOne({
      where: { is_formulario_renovacao: true, nivel_academico: nivel },
      relations: ['steps', 'steps.perguntas', 'vagas'],
    });
    if (!edital) return null;
    return this.toResponse(edital);
  }

  async findFormularioRenovacaoComMeuStatus(userId: string) {
    const aluno = await this.alunoRepository.findOne({
      where: { usuario: { usuario_id: userId } },
    });
    const nivel =
      (aluno?.nivel_academico as NivelAcademico) ?? NivelAcademico.GRADUACAO;

    const edital = await this.editalRepository.findOne({
      where: { is_formulario_renovacao: true, nivel_academico: nivel },
      relations: ['steps', 'steps.perguntas', 'vagas'],
    });
    if (!edital) return null;
    let minha_inscricao: {
      id: number;
      status_inscricao: string;
      vaga_id: number;
      observacao_admin?: string;
    } | null = null;
    let renovacao_aprovada = false;
    let elegivel_renovacao = false;

    if (aluno) {
      const algumaAprovada = await this.inscricaoRepository
        .createQueryBuilder('i')
        .innerJoin('i.aluno', 'aluno')
        .innerJoin('i.vagas', 'v')
        .innerJoin('v.edital', 'e')
        .where('aluno.aluno_id = :aid', { aid: aluno.aluno_id })
        .andWhere('i.status_inscricao = :st', {
          st: StatusInscricao.APROVADA,
        })
        .andWhere('e.nivel_academico = :nivel', { nivel })
        .andWhere('e.is_formulario_renovacao = false')
        .getOne();
      elegivel_renovacao = !!algumaAprovada;
    }

    if (aluno && edital.vagas?.length) {
      const vagaIds = edital.vagas.map((v) => v.id);
      const inscricao = await this.inscricaoRepository.findOne({
        where: {
          aluno: { aluno_id: aluno.aluno_id },
          vagas: { id: In(vagaIds) },
        },
        relations: ['vagas'],
        order: { id: 'DESC' },
      });
      if (inscricao) {
        minha_inscricao = {
          id: inscricao.id,
          status_inscricao: inscricao.status_inscricao,
          vaga_id: (inscricao.vagas as Vagas).id,
          observacao_admin: inscricao.observacao_admin ?? undefined,
        };
        renovacao_aprovada = inscricao.status_inscricao === StatusInscricao.APROVADA;
      }
    }

    return {
      ...this.toResponse(edital),
      minha_inscricao,
      renovacao_aprovada,
      elegivel_renovacao,
      /** Compatível com o shape do formulário geral no front */
      pode_se_inscrever_em_outros: false,
    };
  }

  async create(dto: CreateFormularioGeralDto) {
    const nivel =
      (dto.nivel_academico as NivelAcademico) ?? NivelAcademico.GRADUACAO;

    const existente = await this.editalRepository.findOne({
      where: { is_formulario_renovacao: true, nivel_academico: nivel },
    });
    if (existente) {
      existente.is_formulario_renovacao = false;
      await this.editalRepository.save(existente);
    }

    const edital = this.editalRepository.create({
      titulo_edital: dto.titulo_edital ?? 'Formulário de Renovação',
      descricao: dto.descricao ?? undefined,
      status_edital: StatusEdital.ABERTO,
      is_formulario_geral: false,
      is_formulario_renovacao: true,
      nivel_academico: nivel,
    });
    const savedEdital = await this.editalRepository.save(edital);

    const vaga = this.vagasRepository.create({
      beneficio: 'Renovação / Recadastro',
      descricao_beneficio:
        'Formulário obrigatório para estudantes já aprovados em editais anteriores, quando aberto pela PROAE.',
      numero_vagas: 9999,
    });
    vaga.edital = savedEdital;
    await this.vagasRepository.save(vaga);

    if (dto.steps?.length) {
      for (const stepDto of dto.steps) {
        const step = this.stepRepository.create({
          texto: stepDto.texto,
          edital: savedEdital,
        });
        const savedStep = await this.stepRepository.save(step);
        for (const perguntaDto of stepDto.perguntas) {
          const pergunta = this.perguntaRepository.create({
            pergunta: perguntaDto.pergunta,
            tipo_Pergunta: perguntaDto.tipo_Pergunta,
            obrigatoriedade: perguntaDto.obrigatoriedade,
            opcoes: perguntaDto.opcoes ?? undefined,
            tipo_formatacao: perguntaDto.tipo_formatacao ?? undefined,
            step: savedStep,
          });
          await this.perguntaRepository.save(pergunta);
        }
      }
    }

    const criado = await this.editalRepository.findOne({
      where: { is_formulario_renovacao: true, nivel_academico: nivel },
      relations: ['steps', 'steps.perguntas', 'vagas'],
    });
    return criado ? this.toResponse(criado) : null;
  }

  async update(id: number, dto: UpdateFormularioGeralDto) {
    const edital = await this.editalRepository.findOne({
      where: { id, is_formulario_renovacao: true },
    });
    if (!edital) {
      throw new NotFoundException('Formulário de renovação não encontrado');
    }
    if (dto.titulo_edital != null) edital.titulo_edital = dto.titulo_edital;
    if (dto.descricao !== undefined) edital.descricao = dto.descricao;
    if (dto.status_edital != null) edital.status_edital = dto.status_edital;
    await this.editalRepository.save(edital);
    const nivel = edital.nivel_academico as NivelAcademico;
    const recarregado = await this.editalRepository.findOne({
      where: { is_formulario_renovacao: true, nivel_academico: nivel },
      relations: ['steps', 'steps.perguntas', 'vagas'],
    });
    return recarregado ? this.toResponse(recarregado) : null;
  }

  async remove(id: number) {
    const edital = await this.editalRepository.findOne({
      where: { id, is_formulario_renovacao: true },
      relations: ['vagas'],
    });
    if (!edital) {
      throw new NotFoundException('Formulário de renovação não encontrado');
    }
    const vagaIds = edital?.vagas?.map((v) => v.id) ?? [];
    const countInscricoes = vagaIds.length
      ? await this.inscricaoRepository.count({
          where: { vagas: { id: vagaIds[0] } },
        })
      : 0;
    if (countInscricoes > 0) {
      throw new BadRequestException(
        'Não é possível desativar o formulário de renovação pois existem inscrições vinculadas.',
      );
    }
    edital.is_formulario_renovacao = false;
    await this.editalRepository.save(edital);
    return { mensagem: 'Formulário de renovação desativado com sucesso.' };
  }

  private async getEditalFRComVagas(nivel: NivelAcademico) {
    const edital = await this.editalRepository.findOne({
      where: { is_formulario_renovacao: true, nivel_academico: nivel },
      relations: ['vagas'],
    });
    if (!edital) {
      throw new NotFoundException('Formulário de renovação não encontrado');
    }
    if (!edital.vagas?.length) {
      throw new NotFoundException(
        'Formulário de renovação sem vagas configuradas',
      );
    }
    return edital;
  }

  async listarInscricoesFR(nivel: NivelAcademico) {
    const edital = await this.getEditalFRComVagas(nivel);
    const vagaIds = edital.vagas.map((v) => v.id);

    const inscricoes = await this.inscricaoRepository.find({
      where: { vagas: { id: In(vagaIds) } },
      relations: ['aluno', 'aluno.usuario', 'vagas'],
      order: { data_inscricao: 'DESC' },
    });

    return {
      edital_id: edital.id,
      titulo_edital: edital.titulo_edital,
      nivel_academico: edital.nivel_academico,
      total: inscricoes.length,
      inscricoes: inscricoes.map((i) => ({
        id: i.id,
        data_inscricao: i.data_inscricao,
        status_inscricao: i.status_inscricao,
        observacao_admin: i.observacao_admin,
        aluno: {
          aluno_id: i.aluno?.aluno_id,
          matricula: i.aluno?.matricula,
          curso: i.aluno?.curso,
          campus: i.aluno?.campus,
          nome: i.aluno?.usuario?.nome,
          email: i.aluno?.usuario?.email,
          cpf: i.aluno?.usuario?.cpf,
        },
      })),
    };
  }

  async detalheInscricaoFR(inscricaoId: number, nivel: NivelAcademico) {
    const edital = await this.getEditalFRComVagas(nivel);
    const vagaIds = edital.vagas.map((v) => v.id);

    const inscricao = await this.inscricaoRepository.findOne({
      where: { id: inscricaoId, vagas: { id: In(vagaIds) } },
      relations: [
        'aluno',
        'aluno.usuario',
        'vagas',
        'respostas',
        'respostas.pergunta',
        'respostas.pergunta.step',
        'documentos',
        'documentos.validacoes',
      ],
    });
    if (!inscricao) {
      throw new NotFoundException(
        'Inscrição não encontrada no formulário de renovação',
      );
    }

    const stepsMap = new Map<
      number,
      { id: number; texto: string; respostas: any[] }
    >();
    for (const r of inscricao.respostas ?? []) {
      const step = r.pergunta?.step;
      if (!step) continue;
      if (!stepsMap.has(step.id)) {
        stepsMap.set(step.id, { id: step.id, texto: step.texto, respostas: [] });
      }
      stepsMap.get(step.id)!.respostas.push({
        pergunta_id: r.pergunta.id,
        pergunta_texto: r.pergunta.pergunta,
        tipo_Pergunta: r.pergunta.tipo_Pergunta,
        valorTexto: r.valorTexto,
        valorOpcoes: r.valorOpcoes,
        urlArquivo: r.urlArquivo,
        dataResposta: r.dataResposta,
      });
    }

    return {
      id: inscricao.id,
      data_inscricao: inscricao.data_inscricao,
      status_inscricao: inscricao.status_inscricao,
      observacao_admin: inscricao.observacao_admin,
      aluno: {
        aluno_id: inscricao.aluno?.aluno_id,
        matricula: inscricao.aluno?.matricula,
        curso: inscricao.aluno?.curso,
        campus: inscricao.aluno?.campus,
        nome: inscricao.aluno?.usuario?.nome,
        email: inscricao.aluno?.usuario?.email,
        cpf: inscricao.aluno?.usuario?.cpf,
        celular: inscricao.aluno?.usuario?.celular,
      },
      steps: Array.from(stepsMap.values()),
      documentos: (inscricao.documentos ?? []).map((d) => ({
        documento_id: d.documento_id,
        tipo_documento: d.tipo_documento,
        documento_url: d.documento_url,
        status_documento: d.status_documento,
      })),
    };
  }

  async alterarStatusInscricaoFR(
    inscricaoId: number,
    dto: UpdateFGInscricaoStatusDto,
    nivel: NivelAcademico,
    actorUsuarioId?: string | null,
  ) {
    const edital = await this.getEditalFRComVagas(nivel);
    const vagaIds = edital.vagas.map((v) => v.id);

    const inscricao = await this.inscricaoRepository.findOne({
      where: { id: inscricaoId, vagas: { id: In(vagaIds) } },
    });
    if (!inscricao) {
      throw new NotFoundException(
        'Inscrição não encontrada no formulário de renovação',
      );
    }

    const statusAnterior = inscricao.status_inscricao;
    inscricao.status_inscricao = dto.status;
    if (dto.observacao !== undefined) {
      inscricao.observacao_admin = dto.observacao;
    }
    await this.inscricaoRepository.save(inscricao);

    await this.inscricaoAuditLog.logStatusChange({
      inscricaoId,
      actorUsuarioId: actorUsuarioId ?? null,
      statusAnterior,
      statusNovo: dto.status,
      observacao: dto.observacao ?? null,
    });

    return {
      id: inscricao.id,
      status_inscricao: inscricao.status_inscricao,
      observacao_admin: inscricao.observacao_admin,
    };
  }

  private toResponse(edital: Edital) {
    const vagas = edital.vagas ?? [];
    return {
      id: edital.id,
      titulo_edital: edital.titulo_edital,
      descricao: edital.descricao,
      status_edital: edital.status_edital,
      nivel_academico: edital.nivel_academico,
      is_formulario_geral: false,
      is_formulario_renovacao: true,
      data_fim_vigencia: edital.data_fim_vigencia ?? null,
      steps: (edital.steps ?? []).map((s) => ({
        id: s.id,
        texto: s.texto,
        perguntas: (s.perguntas ?? []).map((p) => ({
          id: p.id,
          pergunta: p.pergunta,
          tipo_Pergunta: p.tipo_Pergunta,
          obrigatoriedade: p.obrigatoriedade,
          opcoes: p.opcoes,
          tipo_formatacao: p.tipo_formatacao,
        })),
      })),
      vagas: vagas.map((v) => ({
        id: v.id,
        beneficio: v.beneficio,
        descricao_beneficio: v.descricao_beneficio,
      })),
    };
  }
}
