import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StatusInscricao } from 'src/core/shared-kernel/enums/enumStatusInscricao';
import { Edital } from 'src/infrastructure/persistence/typeorm/entities/edital/edital.entity';
import { Vagas } from 'src/infrastructure/persistence/typeorm/entities/vagas/vagas.entity';
import { Inscricao } from 'src/infrastructure/persistence/typeorm/entities/inscricao/inscricao.entity';
import { Aluno } from 'src/infrastructure/persistence/typeorm/entities/aluno/aluno.entity';
import { Step } from 'src/infrastructure/persistence/typeorm/entities/step/step.entity';
import { Pergunta } from 'src/infrastructure/persistence/typeorm/entities/pergunta/pergunta.entity';
import { StatusEdital } from 'src/core/shared-kernel/enums/enumStatusEdital';
import { In } from 'typeorm';
import type { CreateFormularioGeralDto } from './dto/create-formulario-geral.dto';
import type { UpdateFormularioGeralDto } from './dto/update-formulario-geral.dto';
import type { UpdateFGInscricaoStatusDto } from './dto/update-fg-inscricao-status.dto';

@Injectable()
export class FormularioGeralService {
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
  ) {}

  async findFormularioGeral() {
    const edital = await this.editalRepository.findOne({
      where: { is_formulario_geral: true },
      relations: ['steps', 'steps.perguntas', 'vagas'],
    });
    if (!edital) return null;
    return this.toFormularioGeralResponse(edital);
  }

  async findFormularioGeralComMeuStatus(userId: string) {
    const edital = await this.editalRepository.findOne({
      where: { is_formulario_geral: true },
      relations: ['steps', 'steps.perguntas', 'vagas'],
    });
    if (!edital) return null;

    const aluno = await this.alunoRepository.findOne({
      where: { usuario: { usuario_id: userId } },
    });
    let minha_inscricao: {
      id: number;
      status_inscricao: string;
      vaga_id: number;
      observacao_admin?: string;
    } | null = null;
    let pode_se_inscrever_em_outros = false;

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
        pode_se_inscrever_em_outros = inscricao.status_inscricao === StatusInscricao.APROVADA;
      }
    }

    return {
      ...this.toFormularioGeralResponse(edital),
      minha_inscricao,
      pode_se_inscrever_em_outros,
    };
  }

  async create(dto: CreateFormularioGeralDto) {
    const existente = await this.editalRepository.findOne({
      where: { is_formulario_geral: true },
    });
    if (existente) {
      existente.is_formulario_geral = false;
      await this.editalRepository.save(existente);
    }

    const edital = this.editalRepository.create({
      titulo_edital: dto.titulo_edital ?? 'Formulário Geral',
      descricao: dto.descricao ?? undefined,
      status_edital: StatusEdital.ABERTO,
      is_formulario_geral: true,
    });
    const savedEdital = await this.editalRepository.save(edital);

    const vaga = this.vagasRepository.create({
      beneficio: 'Formulário Geral',
      descricao_beneficio: 'Formulário geral obrigatório para inscrições em editais.',
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

    return this.findFormularioGeral();
  }

  async update(id: number, dto: UpdateFormularioGeralDto) {
    const edital = await this.editalRepository.findOne({
      where: { id, is_formulario_geral: true },
    });
    if (!edital) throw new NotFoundException('Formulário geral não encontrado');
    if (dto.titulo_edital != null) edital.titulo_edital = dto.titulo_edital;
    if (dto.descricao !== undefined) edital.descricao = dto.descricao;
    if (dto.status_edital != null) edital.status_edital = dto.status_edital;
    await this.editalRepository.save(edital);
    return this.findFormularioGeral();
  }

  async remove(id: number) {
    const edital = await this.editalRepository.findOne({
      where: { id, is_formulario_geral: true },
      relations: ['vagas'],
    });
    const vagaIds = edital?.vagas?.map((v) => v.id) ?? [];
    const countInscricoes = vagaIds.length
      ? await this.inscricaoRepository.count({ where: { vagas: { id: vagaIds[0] } } })
      : 0;
    if (!edital) throw new NotFoundException('Formulário geral não encontrado');
    if (countInscricoes > 0) {
      throw new BadRequestException(
        'Não é possível desativar o Formulário Geral pois existem inscrições vinculadas.',
      );
    }
    edital.is_formulario_geral = false;
    await this.editalRepository.save(edital);
    return { mensagem: 'Formulário geral desativado com sucesso.' };
  }

  /* ── Gestão de inscrições do FG ── */

  private async getEditalFGComVagas() {
    const edital = await this.editalRepository.findOne({
      where: { is_formulario_geral: true },
      relations: ['vagas'],
    });
    if (!edital) throw new NotFoundException('Formulário geral não encontrado');
    if (!edital.vagas?.length) throw new NotFoundException('Formulário geral sem vagas configuradas');
    return edital;
  }

  async listarInscricoesFG() {
    const edital = await this.getEditalFGComVagas();
    const vagaIds = edital.vagas.map((v) => v.id);

    const inscricoes = await this.inscricaoRepository.find({
      where: { vagas: { id: In(vagaIds) } },
      relations: ['aluno', 'aluno.usuario', 'vagas'],
      order: { data_inscricao: 'DESC' },
    });

    return {
      edital_id: edital.id,
      titulo_edital: edital.titulo_edital,
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

  async detalheInscricaoFG(inscricaoId: number) {
    const edital = await this.getEditalFGComVagas();
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
    if (!inscricao) throw new NotFoundException('Inscrição não encontrada no Formulário Geral');

    const stepsMap = new Map<number, { id: number; texto: string; respostas: any[] }>();
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

  async alterarStatusInscricaoFG(inscricaoId: number, dto: UpdateFGInscricaoStatusDto) {
    const edital = await this.getEditalFGComVagas();
    const vagaIds = edital.vagas.map((v) => v.id);

    const inscricao = await this.inscricaoRepository.findOne({
      where: { id: inscricaoId, vagas: { id: In(vagaIds) } },
    });
    if (!inscricao) throw new NotFoundException('Inscrição não encontrada no Formulário Geral');

    inscricao.status_inscricao = dto.status;
    if (dto.observacao !== undefined) {
      inscricao.observacao_admin = dto.observacao;
    }
    await this.inscricaoRepository.save(inscricao);

    return {
      id: inscricao.id,
      status_inscricao: inscricao.status_inscricao,
      observacao_admin: inscricao.observacao_admin,
    };
  }

  private toFormularioGeralResponse(edital: Edital) {
    const vagas = edital.vagas ?? [];
    return {
      id: edital.id,
      titulo_edital: edital.titulo_edital,
      descricao: edital.descricao,
      status_edital: edital.status_edital,
      is_formulario_geral: true,
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
      vagas: vagas.map((v) => ({ id: v.id, beneficio: v.beneficio, descricao_beneficio: v.descricao_beneficio })),
    };
  }
}
