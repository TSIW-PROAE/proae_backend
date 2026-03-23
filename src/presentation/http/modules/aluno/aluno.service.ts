import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { RolesEnum } from 'src/core/shared-kernel/enums/enumRoles';
import { StatusDocumento } from 'src/core/shared-kernel/enums/statusDocumento';
import { Aluno } from 'src/infrastructure/persistence/typeorm/entities/aluno/aluno.entity';
import { Edital } from 'src/infrastructure/persistence/typeorm/entities/edital/edital.entity';
import { Inscricao } from 'src/infrastructure/persistence/typeorm/entities/inscricao/inscricao.entity';
import { Resposta } from 'src/infrastructure/persistence/typeorm/entities/resposta/resposta.entity';
import { Step } from 'src/infrastructure/persistence/typeorm/entities/step/step.entity';
import { Usuario } from 'src/infrastructure/persistence/typeorm/entities/usuarios/usuario.entity';
import { Vagas } from 'src/infrastructure/persistence/typeorm/entities/vagas/vagas.entity';
import { StatusBeneficioEdital } from 'src/core/shared-kernel/enums/enumStatusBeneficioEdital';
import { StatusInscricao } from 'src/core/shared-kernel/enums/enumStatusInscricao';
import { AuthService } from 'src/presentation/http/modules/auth/auth.service';
import { AtualizaDadosAlunoDTO } from './dto/atualizaDadosAluno';
import type { CompleteCadastroAlunoDto } from './dto/complete-cadastro-aluno.dto';
import { NivelAcademico } from 'src/core/shared-kernel/enums/enumNivelAcademico';

/** YYYY-MM-DD para o portal (evita Invalid Date no front). */
function serializeDateOnly(d: unknown): string {
  if (d == null) return '';
  if (d instanceof Date) {
    return d.toISOString().slice(0, 10);
  }
  const s = String(d);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const parsed = new Date(s);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
}

/** Alinha com `GET /documentos/pendencias/meus`: qualquer doc que não esteja aprovado. */
function documentoNaoAprovado(d: { status_documento?: string }): boolean {
  return d.status_documento !== StatusDocumento.APROVADO;
}

/**
 * Mesma regra que `RespostaTypeOrmRepository` usa para `aguardandoRespostaNovaPergunta`
 * no questionário do aluno. Se o prazo de complemento já passou, não conta como pendência ativa.
 */
function respostaAguardandoNovaPerguntaPendente(r: Resposta): boolean {
  if (!r.perguntaAdicionadaPosInscricao) return false;
  if (r.valorTexto) return false;
  if (r.urlArquivo) return false;
  if (r.valorOpcoes && r.valorOpcoes.length > 0) return false;
  if (r.prazoRespostaNovaPergunta != null) {
    const fim = new Date(r.prazoRespostaNovaPergunta);
    if (!Number.isNaN(fim.getTime()) && fim.getTime() < Date.now()) {
      return false;
    }
  }
  return true;
}

/**
 * Resposta invalidada com pedido de correção/reenvio (não expirada).
 */
function respostaRequerReenvioPendente(r: Resposta): boolean {
  if (!r.requerReenvio) return false;
  if (r.prazoReenvio != null) {
    const fim = new Date(r.prazoReenvio);
    if (!Number.isNaN(fim.getTime()) && fim.getTime() < Date.now()) {
      return false;
    }
  }
  return true;
}

/** Campos esperados pelo `CandidateStatus` no portal. */
function computeNovasPerguntasPendentesPortal(inscricao: Inscricao): {
  possui_novas_perguntas_pendentes: boolean;
  total_novas_perguntas: number;
  novas_perguntas_pendentes_por_step: Array<{
    step_id: string;
    step_texto: string;
    total_novas: number;
    /** Para deep-link igual a pendências (`pergunta_id` na URL). */
    primeira_pergunta_id?: number;
  }>;
} {
  const respostas = inscricao.respostas ?? [];
  const candidatas = respostas.filter((r) => {
    if (r.pergunta?.step?.id == null) return false;
    return (
      respostaAguardandoNovaPerguntaPendente(r) ||
      respostaRequerReenvioPendente(r)
    );
  });

  const porStep = new Map<
    number,
    {
      step_texto: string;
      total_novas: number;
      primeira_pergunta_id: number | null;
    }
  >();
  for (const r of candidatas) {
    const step = r.pergunta!.step;
    const sid = step.id;
    const pid = r.pergunta?.id;
    const atual = porStep.get(sid);
    const texto = (step.texto ?? 'Questionário').trim() || 'Questionário';
    if (atual) {
      atual.total_novas += 1;
      if (typeof pid === 'number') {
        atual.primeira_pergunta_id =
          atual.primeira_pergunta_id == null
            ? pid
            : Math.min(atual.primeira_pergunta_id, pid);
      }
    } else {
      porStep.set(sid, {
        step_texto: texto,
        total_novas: 1,
        primeira_pergunta_id: typeof pid === 'number' ? pid : null,
      });
    }
  }

  const novas_perguntas_pendentes_por_step = [...porStep.entries()]
    .sort(([a], [b]) => a - b)
    .map(([stepId, v]) => ({
      step_id: String(stepId),
      step_texto: v.step_texto,
      total_novas: v.total_novas,
      ...(v.primeira_pergunta_id != null
        ? { primeira_pergunta_id: v.primeira_pergunta_id }
        : {}),
    }));

  const total_novas_perguntas = candidatas.length;

  return {
    possui_novas_perguntas_pendentes: total_novas_perguntas > 0,
    total_novas_perguntas,
    novas_perguntas_pendentes_por_step,
  };
}

/** Alinha com o formato esperado pelo `CandidateStatus` (datas string). */
function normalizeEtapaEditalParaPortal(
  raw: Edital['etapa_edital'],
): Array<{
  etapa: string;
  ordem_elemento: number;
  data_inicio: string;
  data_fim: string;
}> {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.map((e) => ({
    etapa: e.etapa,
    ordem_elemento: e.ordem_elemento,
    data_inicio: serializeDateOnly(e.data_inicio as unknown),
    data_fim: serializeDateOnly(e.data_fim as unknown),
  }));
}

@Injectable()
export class AlunoService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(Aluno)
    private readonly alunoRepository: Repository<Aluno>,
    @InjectRepository(Step)
    private readonly stepRepository: Repository<Step>,
    @InjectRepository(Edital)
    private readonly editalRepository: Repository<Edital>,
    @InjectRepository(Vagas)
    private readonly vagasRepository: Repository<Vagas>,
    @InjectRepository(Inscricao)
    private readonly inscricaoRepository: Repository<Inscricao>,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
  ) {}

  /**
   * Bloqueia rotas do portal do estudante até confirmar o email (exceto quem tem papel admin).
   */
  async assertAlunoEmailConfirmadoParaPortal(
    userId: string,
    roles?: (RolesEnum | string)[] | null,
  ): Promise<void> {
    const isAdmin =
      roles?.includes(RolesEnum.ADMIN) || roles?.includes('admin');
    if (isAdmin) return;

    const usuario = await this.usuarioRepository.findOne({
      where: { usuario_id: userId },
      relations: ['aluno'],
    });
    if (!usuario?.aluno) return;
    if (!usuario.aluno.cadastroEmailConfirmado) {
      throw new ForbiddenException(
        'Confirme seu email para acessar o portal do estudante. Verifique sua caixa de entrada e o spam.',
      );
    }
  }

  /**
   * Vincula perfil de aluno à conta do usuário logado (quando ele ainda não tem).
   * Use quando GET /aluno/me retorna 404 — a pessoa está “no perfil aluno” mas o backend não tinha o registro.
   */
  async completeCadastro(userId: string, dto: CompleteCadastroAlunoDto) {
    const usuario = await this.usuarioRepository.findOne({
      where: { usuario_id: userId },
      relations: ['aluno', 'admin'],
    });
    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }
    if (usuario.aluno) {
      throw new BadRequestException(
        'Sua conta já possui cadastro de aluno. Use a atualização de dados se precisar alterar.',
      );
    }
    const matriculaExistente = await this.alunoRepository.findOne({
      where: { matricula: dto.matricula },
      relations: ['usuario'],
    });
    if (matriculaExistente) {
      // Matrícula já existe. O usuário logado está reivindicando-a.
      // Transfere o perfil de aluno para a conta atual (cenário: usuário criou
      // conta de aluno com um email e conta de admin com outro, quer unificar).
      const usuarioAnterior = matriculaExistente.usuario;
      matriculaExistente.usuario = usuario;
      matriculaExistente.curso = dto.curso;
      matriculaExistente.campus = dto.campus;
      matriculaExistente.data_ingresso = dto.data_ingresso;
      matriculaExistente.nivel_academico = dto.nivel_academico;
      await this.alunoRepository.save(matriculaExistente);

      const curRoles = Array.isArray(usuario.roles) ? usuario.roles : [];
      const rolesAtualizados = curRoles.includes(RolesEnum.ALUNO)
        ? curRoles
        : [...curRoles, RolesEnum.ALUNO];
      await this.usuarioRepository.update(usuario.usuario_id, {
        roles: rolesAtualizados,
      });

      // Limpa a role ALUNO da conta antiga para não ficar dessincronizada
      if (usuarioAnterior?.usuario_id && usuarioAnterior.usuario_id !== usuario.usuario_id) {
        const rolesAntigo = (usuarioAnterior.roles ?? []) as RolesEnum[];
        const novoRoles = rolesAntigo.filter((r): r is RolesEnum => r !== RolesEnum.ALUNO);
        await this.usuarioRepository.update(usuarioAnterior.usuario_id, {
          roles: novoRoles as RolesEnum[],
        });
      }

      const { aguardando_confirmacao_email } =
        await this.authService.aplicarConfirmacaoEmailPosCadastroAluno(userId);
      return {
        sucesso: true,
        mensagem: aguardando_confirmacao_email
          ? 'Enviamos um link de confirmação para seu email. Após confirmar, você poderá se inscrever em editais.'
          : 'Cadastro de aluno vinculado à sua conta. Agora você pode se inscrever em editais.',
        aguardando_confirmacao_email,
        dados: {
          aluno_id: matriculaExistente.aluno_id,
          matricula: matriculaExistente.matricula,
          curso: matriculaExistente.curso,
          campus: matriculaExistente.campus,
          data_ingresso: matriculaExistente.data_ingresso,
          nivel_academico: matriculaExistente.nivel_academico,
        },
      };
    }
    const aluno = this.alunoRepository.create({
      matricula: dto.matricula,
      curso: dto.curso,
      campus: dto.campus,
      data_ingresso: dto.data_ingresso,
      nivel_academico: dto.nivel_academico,
      usuario,
    });
    await this.alunoRepository.save(aluno);
    const curRolesNew = Array.isArray(usuario.roles) ? usuario.roles : [];
    const rolesAtualizadosNew = curRolesNew.includes(RolesEnum.ALUNO)
      ? curRolesNew
      : [...curRolesNew, RolesEnum.ALUNO];
    await this.usuarioRepository.update(usuario.usuario_id, {
      roles: rolesAtualizadosNew,
    });
    const { aguardando_confirmacao_email: aguardandoNovo } =
      await this.authService.aplicarConfirmacaoEmailPosCadastroAluno(userId);
    return {
      sucesso: true,
      mensagem: aguardandoNovo
        ? 'Enviamos um link de confirmação para seu email. Após confirmar, você poderá se inscrever em editais.'
        : 'Cadastro de aluno vinculado à sua conta. Agora você pode se inscrever em editais.',
      aguardando_confirmacao_email: aguardandoNovo,
      dados: {
        aluno_id: aluno.aluno_id,
        matricula: aluno.matricula,
        curso: aluno.curso,
        campus: aluno.campus,
        data_ingresso: aluno.data_ingresso,
        nivel_academico: aluno.nivel_academico,
      },
    };
  }

  async findUsers() {
    const usuarios = await this.usuarioRepository.find({
      relations: ['aluno', 'aluno.inscricoes'],
    });

    const comAluno = (usuarios ?? []).filter((u) => u.aluno);

    if (comAluno.length === 0) {
      throw new NotFoundException('Alunos não encontrados.');
    }

    const dados = comAluno.map((usuario) => {
      const aluno = usuario.aluno!;

      return {
        aluno_id: aluno.aluno_id,
        email: usuario.email,
        matricula: aluno.matricula,
        data_nascimento: usuario.data_nascimento,
        nivel_academico: aluno.nivel_academico,
        curso: aluno.curso,
        campus: aluno.campus,
        cpf: usuario.cpf,
        data_ingresso: aluno.data_ingresso,
        celular: usuario.celular,
        inscricoes: aluno.inscricoes || [],
      };
    });
    return {
      sucesso: true,
      dados,
    };
  }
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

    const hasAnyData = Object.values(atualizaDadosAlunoDTO).some(
      (value) => value !== undefined && value !== null && value !== '',
    );

    if (!hasAnyData) {
      throw new BadRequestException('Dados para atualização não fornecidos.');
    }

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

    Object.assign(usuario.aluno, {
      matricula: atualizaDadosAlunoDTO.matricula || usuario.aluno.matricula,
      curso: atualizaDadosAlunoDTO.curso || usuario.aluno.curso,
      campus: atualizaDadosAlunoDTO.campus || usuario.aluno.campus,
      data_ingresso:
        atualizaDadosAlunoDTO.data_ingresso || usuario.aluno.data_ingresso,
    });

    if (atualizaDadosAlunoDTO.celular) {
      usuario.celular = atualizaDadosAlunoDTO.celular;
    }

    await this.usuarioRepository.save(usuario);

    return {
      success: true,
      message: 'Dados do aluno atualizados com sucesso!',
    };
  }

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

  async getStudentRegistration(userId: string) {
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

    const porVaga = new Map<number, Inscricao>();
    for (const inscricao of inscricoes) {
      const vagaId = (inscricao.vagas as any)?.id ?? 0;
      const existing = porVaga.get(vagaId);
      if (!existing || inscricao.id > existing.id) {
        porVaga.set(vagaId, inscricao);
      }
    }

    return Array.from(porVaga.values()).map((inscricao: Inscricao) => {
      const vagas = inscricao.vagas as Vagas | undefined;
      const edital = vagas?.edital;
      const hasPendencias = (inscricao.documentos || []).some((d) =>
        documentoNaoAprovado(d),
      );
      const pendenteDocs = (inscricao.documentos || []).filter((d) =>
        documentoNaoAprovado(d),
      );
      const novasPerg = computeNovasPerguntasPendentesPortal(inscricao);
      return {
        edital_id: edital?.id ?? 0,
        inscricao_id: inscricao.id,
        titulo_edital: edital?.titulo_edital ?? 'Edital',
        status_edital: edital?.status_edital ?? '',
        nivel_academico:
          (edital?.nivel_academico as NivelAcademico) ??
          NivelAcademico.GRADUACAO,
        is_formulario_geral: edital?.is_formulario_geral ?? false,
        is_formulario_renovacao: edital?.is_formulario_renovacao ?? false,
        /** Nome alinhado ao front (`CandidateStatus`); etapas vêm do cadastro do edital. */
        etapa_edital: normalizeEtapaEditalParaPortal(edital?.etapa_edital),
        data_inscricao: serializeDateOnly(inscricao.data_inscricao),
        status_inscricao: inscricao.status_inscricao,
        /** Homologação como beneficiário da vaga no edital (independe visualmente da análise, mas a regra de negócio exige inscrição aprovada para marcar). */
        status_beneficio_edital: inscricao.status_beneficio_edital,
        observacao_admin: inscricao.observacao_admin ?? null,
        possui_pendencias: hasPendencias,
        total_pendencias: pendenteDocs.length,
        possui_novas_perguntas_pendentes:
          novasPerg.possui_novas_perguntas_pendentes,
        total_novas_perguntas: novasPerg.total_novas_perguntas,
        novas_perguntas_pendentes_por_step:
          novasPerg.novas_perguntas_pendentes_por_step,
        vaga: vagas
          ? {
              vaga_id: String(vagas.id),
              beneficio: vagas.beneficio ?? '',
              descricao_beneficio: vagas.descricao_beneficio ?? '',
              numero_vagas: vagas.numero_vagas ?? 0,
            }
          : undefined,
      };
    });
  }

  /**
   * Card "Meus benefícios" no portal (`GET /beneficios/aluno`).
   * Só lista quem está **Beneficiário no edital** e com **Inscrição Aprovada** na análise
   * (benefício homologado só após validação/aprovação da inscrição).
   */
  async listarBeneficiosPortalAluno(
    userId: string,
    roles?: (RolesEnum | string)[] | null,
  ): Promise<{
    dados: {
      beneficios: Array<{
        titulo_beneficio: string;
        titulo_edital: string;
        data_inicio: string;
        beneficio: string;
        edital_id: number | null;
        inscricao_id: number;
        inscricao_aprovada_na_analise: boolean;
        beneficiario_homologado_no_edital: boolean;
        resumo_para_aluno: string;
      }>;
    };
  }> {
    await this.assertAlunoEmailConfirmadoParaPortal(userId, roles);

    const usuario = await this.usuarioRepository.findOne({
      where: { usuario_id: userId },
      relations: ['aluno'],
    });
    if (!usuario?.aluno) {
      return { dados: { beneficios: [] } };
    }

    const nivelAluno = usuario.aluno.nivel_academico;

    const inscricoes = await this.inscricaoRepository
      .createQueryBuilder('i')
      .innerJoin('i.aluno', 'aluno')
      .innerJoinAndSelect('i.vagas', 'v')
      .innerJoinAndSelect('v.edital', 'e')
      .where('aluno.aluno_id = :aid', { aid: usuario.aluno.aluno_id })
      .andWhere('i.status_beneficio_edital = :ben', {
        ben: StatusBeneficioEdital.BENEFICIARIO,
      })
      .andWhere('i.status_inscricao = :st', { st: StatusInscricao.APROVADA })
      .andWhere('e.nivel_academico = :nivel', { nivel: nivelAluno })
      .orderBy('i.data_inscricao', 'DESC')
      .getMany();

    const beneficios = inscricoes.map((ins) => {
      const v = ins.vagas as Vagas | undefined;
      const ed = v?.edital;
      const tituloVaga =
        v?.beneficio?.trim() ||
        ed?.titulo_edital?.trim() ||
        'Benefício';
      const tituloEdital = ed?.titulo_edital?.trim() || 'Edital';
      const dataIni = ins.data_inscricao
        ? new Date(ins.data_inscricao).toISOString().slice(0, 10)
        : '';
      return {
        titulo_beneficio: tituloVaga,
        titulo_edital: tituloEdital,
        data_inicio: dataIni,
        /** Texto esperado pelo `BenefitsCard` (filtro "ativo") */
        beneficio: 'Benefício ativo',
        edital_id: ed?.id ?? null,
        inscricao_id: ins.id,
        inscricao_aprovada_na_analise: true,
        beneficiario_homologado_no_edital: true,
        resumo_para_aluno:
          'Sua inscrição foi aprovada na análise e você foi homologado como beneficiário da vaga neste edital.',
      };
    });

    return { dados: { beneficios } };
  }

  /**
   * [Admin] Dados cadastrais + todas as inscrições (por vaga) para hub único.
   */
  async getAdminAlunoResumo(alunoId: number) {
    const aluno = await this.alunoRepository.findOne({
      where: { aluno_id: alunoId },
      relations: [
        'usuario',
        'inscricoes',
        'inscricoes.vagas',
        'inscricoes.vagas.edital',
        'inscricoes.documentos',
      ],
    });

    if (!aluno) {
      throw new NotFoundException('Aluno não encontrado.');
    }

    const usuario = aluno.usuario;
    const inscricoes = aluno.inscricoes || [];

    const porVaga = new Map<number, Inscricao>();
    for (const inscricao of inscricoes) {
      const vagaId = (inscricao.vagas as { id?: number })?.id ?? 0;
      const existing = porVaga.get(vagaId);
      if (!existing || inscricao.id > existing.id) {
        porVaga.set(vagaId, inscricao);
      }
    }

    const itens = Array.from(porVaga.values()).map((inscricao: Inscricao) => {
      const vagas = inscricao.vagas as Vagas | undefined;
      const edital = vagas?.edital;
      const hasPendencias = (inscricao.documentos || []).some((d) =>
        documentoNaoAprovado(d),
      );
      let processo_tipo: 'FORMULARIO_GERAL' | 'RENOVACAO' | 'EDITAL';
      if (edital?.is_formulario_geral) {
        processo_tipo = 'FORMULARIO_GERAL';
      } else if (edital?.is_formulario_renovacao) {
        processo_tipo = 'RENOVACAO';
      } else {
        processo_tipo = 'EDITAL';
      }
      return {
        edital_id: edital?.id ?? 0,
        vaga_id: vagas?.id ?? null,
        inscricao_id: inscricao.id,
        titulo_edital: edital?.titulo_edital ?? 'Edital',
        status_edital: edital?.status_edital ?? '',
        nivel_academico:
          edital?.nivel_academico ?? NivelAcademico.GRADUACAO,
        is_formulario_geral: edital?.is_formulario_geral ?? false,
        is_formulario_renovacao: edital?.is_formulario_renovacao ?? false,
        processo_tipo,
        data_inscricao: inscricao.data_inscricao,
        status_inscricao: inscricao.status_inscricao,
        status_beneficio_edital: inscricao.status_beneficio_edital,
        beneficio_nome: vagas?.beneficio ?? null,
        observacao_admin: inscricao.observacao_admin ?? null,
        possui_pendencias: hasPendencias,
      };
    });

    return {
      aluno: {
        aluno_id: aluno.aluno_id,
        nome: usuario?.nome ?? null,
        email: usuario?.email ?? null,
        matricula: aluno.matricula,
        cpf: usuario?.cpf ?? null,
        celular: usuario?.celular ?? null,
        curso: aluno.curso,
        campus: aluno.campus,
        data_nascimento: usuario?.data_nascimento ?? null,
        data_ingresso: aluno.data_ingresso,
        nivel_academico: aluno.nivel_academico,
      },
      inscricoes: itens,
    };
  }

  /**
   * [Admin] Alunos que têm pelo menos uma inscrição vinculada ao edital (via vaga).
   * Filtros opcionais distinguem **benefício no edital** de **inscrição aprovada na análise**.
   */
  async listarAlunosComInscricaoNoEdital(
    editalId: number,
    opts: {
      apenasBeneficiariosEdital?: boolean;
      apenasInscricaoAprovada?: boolean;
    },
  ) {
    const edital = await this.editalRepository.findOne({
      where: { id: editalId },
    });
    if (!edital) {
      throw new NotFoundException(`Edital com ID ${editalId} não encontrado.`);
    }

    const qb = this.inscricaoRepository
      .createQueryBuilder('inscricao')
      .innerJoinAndSelect('inscricao.aluno', 'aluno')
      .innerJoinAndSelect('aluno.usuario', 'usuario')
      .innerJoin('inscricao.vagas', 'vaga')
      .innerJoin('vaga.edital', 'edital')
      .where('edital.id = :editalId', { editalId });

    if (opts.apenasBeneficiariosEdital) {
      qb.andWhere('inscricao.status_beneficio_edital = :ben', {
        ben: StatusBeneficioEdital.BENEFICIARIO,
      });
    }
    if (opts.apenasInscricaoAprovada) {
      qb.andWhere('inscricao.status_inscricao = :st', {
        st: StatusInscricao.APROVADA,
      });
    }

    const inscricoes = await qb.getMany();
    const seen = new Set<number>();
    const dados: {
      aluno_id: number;
      nome: string;
      email: string;
      matricula: string;
      data_nascimento: Date;
      curso: string;
      campus: string;
      cpf: string;
      data_ingresso: string;
      celular: string;
      inscricoes: unknown[];
    }[] = [];

    for (const ins of inscricoes) {
      const a = ins.aluno;
      const u = a?.usuario;
      if (!a || !u || seen.has(a.aluno_id)) continue;
      seen.add(a.aluno_id);
      dados.push({
        aluno_id: a.aluno_id,
        nome: u.nome,
        email: u.email,
        matricula: a.matricula,
        data_nascimento: u.data_nascimento,
        curso: a.curso,
        campus: a.campus,
        cpf: u.cpf,
        data_ingresso: a.data_ingresso,
        celular: u.celular,
        inscricoes: [],
      });
    }

    return { sucesso: true as const, dados };
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
