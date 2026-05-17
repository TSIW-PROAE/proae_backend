import { Injectable } from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { Edital } from '../entities/edital/edital.entity';
import { Inscricao } from '../entities/inscricao/inscricao.entity';
import { StatusEdital } from '../../../../core/shared-kernel/enums/enumStatusEdital';
import { NivelAcademico } from '../../../../core/shared-kernel/enums/enumNivelAcademico';
import type {
  AlunoInscritoData,
} from '../../../../core/domain/edital/ports/edital.repository.port';
import type {
  EditalData,
  CreateEditalData,
  UpdateEditalData,
  StatusEditalDomain,
} from '../../../../core/domain/edital/edital.types';
import type { IEditalRepository } from '../../../../core/domain/edital/ports/edital.repository.port';

const STATUS_TO_ENUM: Record<StatusEditalDomain, StatusEdital> = {
  RASCUNHO: StatusEdital.RASCUNHO,
  ABERTO: StatusEdital.ABERTO,
  ENCERRADO: StatusEdital.ENCERRADO,
  EM_ANDAMENTO: StatusEdital.EM_ANDAMENTO,
};

const ENUM_TO_STATUS: Record<StatusEdital, StatusEditalDomain> = {
  [StatusEdital.RASCUNHO]: 'RASCUNHO',
  [StatusEdital.ABERTO]: 'ABERTO',
  [StatusEdital.ENCERRADO]: 'ENCERRADO',
  [StatusEdital.EM_ANDAMENTO]: 'EM_ANDAMENTO',
};

@Injectable()
export class EditalTypeOrmRepository implements IEditalRepository {
  constructor(
    @InjectRepository(Edital)
    private readonly editalRepository: Repository<Edital>,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async create(data: CreateEditalData): Promise<EditalData> {
    const nivel =
      (data.nivel_academico as NivelAcademico) ?? NivelAcademico.GRADUACAO;
    const edital = new Edital({
      titulo_edital: data.titulo_edital,
      status_edital: StatusEdital.RASCUNHO,
      descricao: undefined,
      edital_url: undefined,
      etapa_edital: undefined,
      nivel_academico: nivel,
    });
    const saved = await this.editalRepository.save(edital);
    return this.toEditalData(saved);
  }

  async findAll(nivelAcademico?: string): Promise<EditalData[]> {
    const list = await this.editalRepository.find({
      where: {
        is_formulario_geral: false,
        ...(nivelAcademico
          ? { nivel_academico: nivelAcademico as NivelAcademico }
          : {}),
      },
    });
    return list.map((e) => this.toEditalData(e));
  }

  async findOne(id: number): Promise<EditalData | null> {
    const edital = await this.editalRepository.findOne({ where: { id } });
    return edital ? this.toEditalData(edital) : null;
  }

  async update(id: number, data: UpdateEditalData): Promise<EditalData> {
    const edital = await this.editalRepository.findOneBy({ id });
    if (!edital) throw new Error('Edital não encontrado');

    await this.entityManager.transaction(async (tx) => {
      Object.assign(edital, {
        titulo_edital: data.titulo_edital ?? edital.titulo_edital,
        descricao: data.descricao ?? edital.descricao,
        edital_url: data.edital_url ?? edital.edital_url,
        etapa_edital: data.etapa_edital ?? edital.etapa_edital,
        ...(data.nivel_academico != null
          ? { nivel_academico: data.nivel_academico as NivelAcademico }
          : {}),
        // `data_fim_vigencia` é tri-estado: ausente → preserva, null → limpa,
        // valor → atualiza. O controller só inclui a chave quando ela veio
        // no body do PATCH, então `hasOwnProperty` distingue "ausente" de
        // "ausente porque é null".
        ...(Object.prototype.hasOwnProperty.call(data, 'data_fim_vigencia')
          ? {
              data_fim_vigencia: this.parseDataFimVigencia(
                data.data_fim_vigencia,
              ),
            }
          : {}),
      });
      await tx.save(edital);
    });

    const updated = await this.editalRepository.findOneBy({ id });
    return this.toEditalData(updated!);
  }

  /**
   * Converte o input do controller (`Date | string YYYY-MM-DD | null`) no
   * tipo aceito pela coluna `date` do TypeORM (`Date | null`). Strings
   * inválidas viram `null` (semântica de "limpar") em vez de causar
   * erro silencioso de persistência.
   */
  private parseDataFimVigencia(
    value: Date | string | null | undefined,
  ): Date | null {
    if (value === null || value === undefined || value === '') return null;
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }
    const s = String(value).trim();
    if (!s) return null;
    // Aceita `YYYY-MM-DD` (formato canônico do front) e ISO completo.
    const m = /^(\d{4}-\d{2}-\d{2})/.exec(s);
    if (!m) {
      const fallback = new Date(s);
      return Number.isNaN(fallback.getTime()) ? null : fallback;
    }
    // Constrói à meia-noite UTC para evitar deslocamentos de timezone que
    // poderiam fazer "2026-05-10" virar "2026-05-09" em ambientes BRT.
    const d = new Date(`${m[1]}T00:00:00.000Z`);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  async remove(id: number): Promise<void> {
    const edital = await this.editalRepository.findOne({
      where: { id },
      relations: ['vagas', 'vagas.inscricoes', 'steps'],
    });
    if (!edital) throw new Error('Edital não encontrado');

    if (edital.vagas?.some((v) => v.inscricoes?.length)) {
      throw new Error(
        'Não é possível excluir o edital pois existem inscrições vinculadas às vagas',
      );
    }

    await this.entityManager.transaction(async (tx) => {
      if (edital.vagas?.length) await tx.remove(edital.vagas);
      if (edital.steps?.length) await tx.remove(edital.steps);
      await tx.remove(edital);
    });
  }

  async findOpened(nivelAcademico?: string): Promise<EditalData[]> {
    return this.findEditaisPorStatusList(
      [StatusEdital.ABERTO],
      nivelAcademico,
    );
  }

  /**
   * Editais visíveis no portal do aluno: ABERTO + EM_ANDAMENTO + ENCERRADO.
   * (RASCUNHO segue oculto pois ainda não foi publicado.)
   * Excl. formulário geral / renovação. O backend continua impedindo inscrições
   * fora do status ABERTO (ver inscricao.service / inscricao.repository).
   */
  async findVisiveisParaAluno(
    nivelAcademico?: string,
  ): Promise<EditalData[]> {
    return this.findEditaisPorStatusList(
      [StatusEdital.ABERTO, StatusEdital.EM_ANDAMENTO, StatusEdital.ENCERRADO],
      nivelAcademico,
    );
  }

  /**
   * Implementação compartilhada para listas filtradas por um conjunto de
   * status (exclui sempre formulário geral / renovação). Mantém o cálculo de
   * `quantidade_bolsas` e `numero_beneficios` derivado das vagas.
   */
  private async findEditaisPorStatusList(
    statusList: StatusEdital[],
    nivelAcademico?: string,
  ): Promise<EditalData[]> {
    const nivel =
      nivelAcademico != null && nivelAcademico !== ''
        ? (nivelAcademico as NivelAcademico)
        : NivelAcademico.GRADUACAO;
    const list = await this.editalRepository.find({
      where: {
        status_edital: In(statusList),
        is_formulario_geral: false,
        is_formulario_renovacao: false,
        nivel_academico: nivel,
      },
      relations: ['vagas'],
      order: {
        // ABERTO primeiro (alfabeticamente "Edital em aberto" não é o
        // primeiro), por isso usamos updated_at como desempate; o front
        // pode reordenar, se quiser, baseado no status.
        updated_at: 'DESC',
      },
    });
    return list.map((e) => {
      const base = this.toEditalData(e);
      const vagas = e.vagas ?? [];
      const quantidadeBolsas = vagas.reduce(
        (acc, v) => acc + (Number(v.numero_vagas) || 0),
        0,
      );
      return {
        ...base,
        quantidade_bolsas: quantidadeBolsas,
        numero_beneficios: vagas.length,
      };
    });
  }

  async updateStatus(
    id: number,
    status: StatusEditalDomain,
  ): Promise<EditalData> {
    const edital = await this.editalRepository.findOneBy({ id });
    if (!edital) throw new Error('Edital não encontrado');
    const enumStatus = STATUS_TO_ENUM[status];
    await this.entityManager.transaction(async (tx) => {
      edital.status_edital = enumStatus;
      await tx.save(edital);
    });
    const updated = await this.editalRepository.findOneBy({ id });
    return this.toEditalData(updated!);
  }

  async getAlunosInscritos(
    editalId: number,
    limit: number,
    offset: number,
  ): Promise<AlunoInscritoData[]> {
    const skip = offset * limit;
    const inscricoes = await this.entityManager
      .createQueryBuilder(Inscricao, 'inscricao')
      .innerJoinAndSelect('inscricao.aluno', 'aluno')
      .innerJoinAndSelect('aluno.usuario', 'usuario')
      .innerJoinAndSelect('inscricao.vagas', 'vaga')
      .innerJoin('vaga.edital', 'edital')
      .where('edital.id = :editalId', { editalId })
      .orderBy('inscricao.data_inscricao', 'DESC')
      .addOrderBy('inscricao.id', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    const fmtDate = (d: Date | string | null | undefined): string | null => {
      if (d == null) return null;
      if (typeof d === 'string') return d;
      if (d instanceof Date) return d.toISOString().slice(0, 10);
      return String(d);
    };

    return inscricoes.map((insc) => {
      const aluno = insc.aluno;
      const u = aluno.usuario!;
      const di = insc.data_inscricao;
      const dataInsc =
        di instanceof Date
          ? di.toISOString()
          : typeof di === 'string'
            ? di
            : String(di);

      const vaga = insc.vagas;
      return {
        inscricao_id: insc.id,
        status_inscricao: String(insc.status_inscricao),
        status_beneficio_edital: String(insc.status_beneficio_edital),
        beneficio_nome: vaga?.beneficio ?? null,
        data_inscricao: dataInsc,
        aluno_id: aluno.aluno_id,
        usuario_id: u.usuario_id,
        email: u.email,
        nome: u.nome,
        cpf: u.cpf,
        celular: u.celular,
        data_nascimento: fmtDate(u.data_nascimento),
        matricula: aluno.matricula,
        curso: aluno.curso,
        campus: String(aluno.campus),
        data_ingresso: aluno.data_ingresso,
      };
    });
  }

  private toEditalData(e: Edital): EditalData {
    return {
      id: e.id,
      titulo_edital: e.titulo_edital,
      descricao: e.descricao,
      edital_url: e.edital_url as EditalData['edital_url'],
      status_edital: ENUM_TO_STATUS[e.status_edital!],
      etapa_edital: e.etapa_edital as EditalData['etapa_edital'],
      nivel_academico: e.nivel_academico ?? NivelAcademico.GRADUACAO,
      is_formulario_geral: e.is_formulario_geral,
      is_formulario_renovacao: e.is_formulario_renovacao,
      data_fim_vigencia: e.data_fim_vigencia ?? null,
      created_at: (e as unknown as { created_at?: Date }).created_at,
      updated_at: (e as unknown as { updated_at?: Date }).updated_at,
    };
  }
}
