import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Documento } from '../entities/documento/documento.entity';
import { Aluno } from '../entities/aluno/aluno.entity';
import { Inscricao } from '../entities/inscricao/inscricao.entity';
import { StatusDocumento } from '../../../../core/shared-kernel/enums/statusDocumento';
import type {
  CreateDocumentoData,
  DocumentoData,
  DocumentoOwnerData,
  DocumentosComProblemasPorInscricao,
  DocumentoValidacaoResumo,
  UpdateDocumentoData,
} from '../../../../core/domain/documento/documento.types';
import type { IDocumentoRepository } from '../../../../core/domain/documento/ports/documento.repository.port';
import { respostaPrecisaAjuste } from '../../../../core/domain/resposta/resposta-ajuste.policy';

@Injectable()
export class DocumentoTypeOrmRepository implements IDocumentoRepository {
  constructor(
    @InjectRepository(Documento)
    private readonly documentoRepository: Repository<Documento>,
    @InjectRepository(Aluno)
    private readonly alunoRepository: Repository<Aluno>,
    @InjectRepository(Inscricao)
    private readonly inscricaoRepository: Repository<Inscricao>,
  ) {}

  async create(data: CreateDocumentoData): Promise<DocumentoData> {
    const inscricao = await this.inscricaoRepository.findOne({
      where: { id: data.inscricao_id },
    });
    if (!inscricao) {
      throw new Error('Inscrição não encontrada');
    }

    const documento = this.documentoRepository.create({
      inscricao,
      tipo_documento: data.tipo_documento as any,
      documento_url: data.documento_url,
      status_documento: (data.status_documento as any) ?? StatusDocumento.NAO_ENVIADO,
    });
    const saved = await this.documentoRepository.save(documento);
    return this.toDocumentoData(saved);
  }

  async findAllByInscricao(inscricaoId: number): Promise<DocumentoData[]> {
    const documentos = await this.documentoRepository.find({
      where: { inscricao: { id: inscricaoId } },
      relations: ['inscricao', 'validacoes'],
    });
    return documentos.map((d) => this.toDocumentoData(d));
  }

  async findOneById(id: number): Promise<DocumentoData | null> {
    const documento = await this.documentoRepository.findOne({
      where: { documento_id: id },
      relations: ['inscricao', 'validacoes'],
    });
    if (!documento) return null;
    return this.toDocumentoData(documento);
  }

  async findOneByIdWithOwner(id: number): Promise<DocumentoOwnerData | null> {
    const documento = await this.documentoRepository.findOne({
      where: { documento_id: id },
      relations: ['inscricao', 'inscricao.aluno', 'inscricao.aluno.usuario', 'validacoes'],
    });
    if (!documento?.inscricao?.aluno?.usuario?.usuario_id) return null;

    return {
      documento: this.toDocumentoData(documento),
      owner_user_id: documento.inscricao.aluno.usuario.usuario_id,
    };
  }

  async update(id: number, data: UpdateDocumentoData): Promise<DocumentoData> {
    const documento = await this.documentoRepository.findOne({
      where: { documento_id: id },
      relations: ['inscricao', 'validacoes'],
    });
    if (!documento) throw new Error('Documento não encontrado');

    if (data.tipo_documento !== undefined) {
      documento.tipo_documento = data.tipo_documento as any;
    }
    if (data.documento_url !== undefined) {
      documento.documento_url = data.documento_url;
    }
    if (data.status_documento !== undefined) {
      documento.status_documento = data.status_documento as any;
    }

    const saved = await this.documentoRepository.save(documento);
    return this.toDocumentoData(saved);
  }

  async remove(id: number): Promise<void> {
    const documento = await this.documentoRepository.findOne({
      where: { documento_id: id },
    });
    if (!documento) throw new Error('Documento não encontrado');
    await this.documentoRepository.remove(documento);
  }

  async findInscricaoOwnerUserId(inscricaoId: number): Promise<string | null> {
    const inscricao = await this.inscricaoRepository.findOne({
      where: { id: inscricaoId },
      relations: ['aluno', 'aluno.usuario'],
    });
    return inscricao?.aluno?.usuario?.usuario_id ?? null;
  }

  async hasReprovadoDocumentsByStudent(userId: string): Promise<boolean> {
    const docs = await this.getReprovadoDocumentsByStudent(userId);
    return docs.length > 0;
  }

  async getReprovadoDocumentsByStudent(userId: string): Promise<DocumentoData[]> {
    const aluno = await this.alunoRepository.findOne({
      where: { usuario: { usuario_id: userId } },
      relations: ['inscricoes', 'inscricoes.documentos', 'inscricoes.documentos.validacoes'],
    });
    if (!aluno) {
      return [];
    }

    const reprovados: Documento[] = [];
    for (const inscricao of aluno.inscricoes ?? []) {
      const docs = inscricao.documentos ?? [];
      reprovados.push(
        ...docs.filter((doc) => doc.status_documento === StatusDocumento.REPROVADO),
      );
    }
    return reprovados.map((d) => this.toDocumentoData(d));
  }

  async getDocumentsWithProblemsByStudent(
    userId: string,
  ): Promise<DocumentosComProblemasPorInscricao[]> {
    const aluno = await this.alunoRepository.findOne({
      where: { usuario: { usuario_id: userId } },
      relations: [
        'inscricoes',
        'inscricoes.documentos',
        'inscricoes.documentos.validacoes',
        'inscricoes.vagas',
        'inscricoes.vagas.edital',
        'inscricoes.respostas',
        'inscricoes.respostas.pergunta',
        'inscricoes.respostas.pergunta.step',
      ],
    });

    if (!aluno || !aluno.inscricoes?.length) {
      return [];
    }

    const result: DocumentosComProblemasPorInscricao[] = [];
    for (const inscricao of aluno.inscricoes) {
      const documentosNaoAprovados = (inscricao.documentos ?? []).filter(
        (d) => d.status_documento !== StatusDocumento.APROVADO,
      );
      const ajustesResposta = (inscricao.respostas ?? [])
        .filter((r) => respostaPrecisaAjuste(r))
        .map((r) => ({
          resposta_id: r.id,
          pergunta_id: r.pergunta?.id ?? null,
          step_id: r.pergunta?.step?.id ?? null,
          step_texto: r.pergunta?.step?.texto ?? null,
          pergunta_texto: r.pergunta?.pergunta ?? null,
          parecer: r.parecer ?? null,
          prazo_reenvio: r.prazoReenvio ?? null,
          prazo_resposta_nova_pergunta: r.prazoRespostaNovaPergunta ?? null,
          tipo_ajuste: r.perguntaAdicionadaPosInscricao
            ? ('NOVA_PERGUNTA' as const)
            : ('REENVIO_RESPOSTA' as const),
        }));

      if (documentosNaoAprovados.length === 0 && ajustesResposta.length === 0) {
        continue;
      }

      result.push({
        inscricao_id: inscricao.id,
        vaga_id: inscricao.vagas?.id ?? null,
        edital_id: inscricao.vagas?.edital?.id ?? null,
        is_formulario_geral: inscricao.vagas?.edital?.is_formulario_geral ?? false,
        is_formulario_renovacao:
          inscricao.vagas?.edital?.is_formulario_renovacao ?? false,
        titulo_edital: inscricao.vagas?.edital?.titulo_edital ?? 'Edital',
        vaga_beneficio: inscricao.vagas?.beneficio ?? null,
        documentos: documentosNaoAprovados.map((d) => this.toDocumentoData(d)),
        ajustes_resposta: ajustesResposta,
      });
    }
    return result;
  }

  private toDocumentoData(entity: Documento): DocumentoData {
    const validacoes: DocumentoValidacaoResumo[] =
      entity.validacoes?.map((v) => ({
        parecer: v.parecer ?? null,
        data_validacao: v.data_validacao ?? null,
      })) ?? [];

    return {
      id: entity.documento_id,
      inscricao_id: entity.inscricao?.id ?? 0,
      tipo_documento: (entity.tipo_documento as unknown as string) ?? '',
      documento_url: entity.documento_url ?? null,
      status_documento: (entity.status_documento as unknown as string) ?? '',
      validacoes,
      created_at: undefined,
      updated_at: undefined,
    };
  }
}

