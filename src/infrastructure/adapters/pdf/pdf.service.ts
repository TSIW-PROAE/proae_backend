import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
/** pdfkit usa module.exports (sem default) — import default quebra em runtime (default is not a constructor). */
// eslint-disable-next-line @typescript-eslint/no-require-imports
import PDFDocument = require('pdfkit');
import { Repository } from 'typeorm';
import type { PdfRendererPort } from '../../../core/application/utilities/ports/pdf-renderer.port';
import { Edital } from 'src/infrastructure/persistence/typeorm/entities/edital/edital.entity';
import { Inscricao } from 'src/infrastructure/persistence/typeorm/entities/inscricao/inscricao.entity';
import { Step } from 'src/infrastructure/persistence/typeorm/entities/step/step.entity';
import { StatusBeneficioEdital } from '../../../core/shared-kernel/enums/enumStatusBeneficioEdital';
import { StatusInscricao } from '../../../core/shared-kernel/enums/enumStatusInscricao';

type ListaPdfTipo = 'aprovados_analise' | 'beneficiarios_edital';

@Injectable()
export class PdfService implements PdfRendererPort {
  constructor(
    @InjectRepository(Inscricao)
    private readonly inscricaoRepository: Repository<Inscricao>,
    @InjectRepository(Edital)
    private readonly editalRepository: Repository<Edital>,
    @InjectRepository(Step)
    private readonly stepRepository: Repository<Step>,
  ) {}

  async generateAprovadosPdf(editalId?: number): Promise<Buffer> {
    return this.generateListaPdf({
      editalId,
      tipo: 'aprovados_analise',
    });
  }

  async generateBeneficiariosPdf(editalId: number): Promise<Buffer> {
    if (!editalId || Number.isNaN(editalId)) {
      throw new BadRequestException('Informe o editalId para o relatório de beneficiários.');
    }
    return this.generateListaPdf({
      editalId,
      tipo: 'beneficiarios_edital',
    });
  }

  private async generateListaPdf(opts: {
    editalId?: number;
    tipo: ListaPdfTipo;
  }): Promise<Buffer> {
    const { editalId, tipo } = opts;

    const queryBuilder = this.inscricaoRepository
      .createQueryBuilder('inscricao')
      .leftJoinAndSelect('inscricao.aluno', 'aluno')
      .leftJoinAndSelect('aluno.usuario', 'usuario')
      .leftJoinAndSelect('inscricao.vagas', 'vagas')
      .leftJoinAndSelect('vagas.edital', 'edital');

    if (tipo === 'aprovados_analise') {
      queryBuilder.andWhere('inscricao.status_inscricao = :status', {
        status: StatusInscricao.APROVADA,
      });
    } else {
      queryBuilder.andWhere('inscricao.status_beneficio_edital = :ben', {
        ben: StatusBeneficioEdital.BENEFICIARIO,
      });
    }

    if (editalId) {
      const edital = await this.editalRepository.findOne({
        where: { id: editalId },
      });

      if (!edital) {
        throw new NotFoundException('Edital não encontrado');
      }

      queryBuilder.andWhere('edital.id = :editalId', { editalId });
    }

    const inscricoesRaw = await queryBuilder
      .orderBy('usuario.nome', 'ASC')
      .getMany();

    const inscricoes = inscricoesRaw.filter(
      (i) => i.aluno && i.aluno.usuario && i.vagas,
    );

    if (inscricoes.length === 0) {
      const msg =
        tipo === 'aprovados_analise'
          ? 'Nenhum estudante com inscrição aprovada na análise encontrado para os filtros.'
          : 'Nenhum beneficiário homologado no edital encontrado para os filtros.';
      throw new NotFoundException(msg);
    }

    const tituloPrincipal =
      tipo === 'aprovados_analise'
        ? 'Relatório — Inscrições aprovadas (análise)'
        : 'Relatório — Beneficiários no edital';

    const subtituloTipo =
      tipo === 'aprovados_analise'
        ? 'Critério: status da inscrição = Inscrição Aprovada (análise documental / parecer).'
        : 'Critério: situação de benefício = Beneficiário no edital (homologação da vaga).';

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));

    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .text(tituloPrincipal, { align: 'center' })
      .moveDown(0.35);

    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#444444')
      .text(subtituloTipo, { align: 'center' })
      .fillColor('#000000')
      .moveDown();

    if (editalId && inscricoes.length > 0) {
      const edital = inscricoes[0].vagas!.edital!;
      doc
        .fontSize(13)
        .font('Helvetica-Bold')
        .text(`Edital: ${edital.titulo_edital}`, { align: 'center' })
        .moveDown(0.5);
    }

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(
        `Gerado em: ${new Date().toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}`,
        { align: 'center' },
      )
      .moveDown(1.5);

    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .text(`Total: ${inscricoes.length} registro(s)`, {
        align: 'center',
      })
      .moveDown(1.5);

    const incluirColBeneficio = tipo === 'beneficiarios_edital';
    const colWidths = incluirColBeneficio
      ? {
          numero: 28,
          nome: 150,
          matricula: 72,
          email: 128,
          beneficio: 110,
          curso: 88,
          campus: 72,
        }
      : {
          numero: 30,
          nome: 175,
          matricula: 85,
          email: 150,
          beneficio: 0,
          curso: 115,
          campus: 85,
        };

    let yPosition = doc.y;
    const pageWidth = doc.page.width - 100;

    const headerY = yPosition;
    doc.fontSize(8).font('Helvetica-Bold');
    let x = 50;
    doc.text('#', x, headerY, { width: colWidths.numero });
    x += colWidths.numero;
    doc.text('Nome', x, headerY, { width: colWidths.nome });
    x += colWidths.nome;
    doc.text('Matrícula', x, headerY, { width: colWidths.matricula });
    x += colWidths.matricula;
    doc.text('E-mail', x, headerY, { width: colWidths.email });
    x += colWidths.email;
    if (incluirColBeneficio) {
      doc.text('Benefício (vaga)', x, headerY, { width: colWidths.beneficio });
      x += colWidths.beneficio;
    }
    doc.text('Curso', x, headerY, { width: colWidths.curso });
    x += colWidths.curso;
    doc.text('Campus', x, headerY, { width: colWidths.campus });

    yPosition = headerY + 12;
    doc
      .moveTo(50, yPosition)
      .lineTo(pageWidth + 50, yPosition)
      .stroke();
    yPosition += 8;

    inscricoes.forEach((inscricao, index) => {
      if (yPosition > doc.page.height - 100) {
        doc.addPage();
        yPosition = 50;
        const hy = yPosition;
        doc.fontSize(8).font('Helvetica-Bold');
        let hx = 50;
        doc.text('#', hx, hy, { width: colWidths.numero });
        hx += colWidths.numero;
        doc.text('Nome', hx, hy, { width: colWidths.nome });
        hx += colWidths.nome;
        doc.text('Matrícula', hx, hy, { width: colWidths.matricula });
        hx += colWidths.matricula;
        doc.text('E-mail', hx, hy, { width: colWidths.email });
        hx += colWidths.email;
        if (incluirColBeneficio) {
          doc.text('Benefício (vaga)', hx, hy, { width: colWidths.beneficio });
          hx += colWidths.beneficio;
        }
        doc.text('Curso', hx, hy, { width: colWidths.curso });
        hx += colWidths.curso;
        doc.text('Campus', hx, hy, { width: colWidths.campus });
        yPosition = hy + 12;
        doc
          .moveTo(50, yPosition)
          .lineTo(pageWidth + 50, yPosition)
          .stroke();
        yPosition += 8;
      }

      const aluno = inscricao.aluno!;
      const usuario = aluno.usuario!;
      const beneficioTxt = inscricao.vagas?.beneficio ?? '—';

      doc.fontSize(7.5).font('Helvetica');
      let cx = 50;
      doc.text(String(index + 1), cx, yPosition, { width: colWidths.numero });
      cx += colWidths.numero;
      doc.text(usuario.nome || '-', cx, yPosition, {
        width: colWidths.nome,
        ellipsis: true,
      });
      cx += colWidths.nome;
      doc.text(aluno.matricula || '-', cx, yPosition, {
        width: colWidths.matricula,
        ellipsis: true,
      });
      cx += colWidths.matricula;
      doc.text(usuario.email || '-', cx, yPosition, {
        width: colWidths.email,
        ellipsis: true,
      });
      cx += colWidths.email;
      if (incluirColBeneficio) {
        doc.text(beneficioTxt, cx, yPosition, {
          width: colWidths.beneficio,
          ellipsis: true,
        });
        cx += colWidths.beneficio;
      }
      doc.text(aluno.curso || '-', cx, yPosition, {
        width: colWidths.curso,
        ellipsis: true,
      });
      cx += colWidths.curso;
      doc.text(String(aluno.campus || '-'), cx, yPosition, {
        width: colWidths.campus,
        ellipsis: true,
      });

      yPosition += 14;
    });

    const totalPages = doc.bufferedPageRange().count;
    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);
      doc
        .fontSize(8)
        .font('Helvetica')
        .text(
          `Página ${i + 1} de ${totalPages}`,
          doc.page.width / 2,
          doc.page.height - 30,
          { align: 'center' },
        );
    }

    doc.end();

    return new Promise((resolve, reject) => {
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });

      doc.on('error', reject);
    });
  }

  /**
   * PDF de uma inscrição específica, com dados do aluno e respostas
   * organizadas por step e ordem, igual à apresentação ao analista.
   */
  async generateInscricaoDetalhePdf(inscricaoId: number): Promise<Buffer> {
    if (!inscricaoId || Number.isNaN(inscricaoId)) {
      throw new BadRequestException('Informe o inscricaoId.');
    }

    const inscricao = await this.inscricaoRepository.findOne({
      where: { id: inscricaoId },
      relations: {
        aluno: { usuario: true },
        vagas: { edital: true },
        respostas: { pergunta: { step: true } },
      },
    });

    if (!inscricao) {
      throw new NotFoundException('Inscrição não encontrada.');
    }

    const edital = inscricao.vagas?.edital ?? null;
    const stepsDoEdital = edital
      ? await this.stepRepository.find({
          where: { edital: { id: edital.id } },
          relations: { perguntas: true },
          order: { ordem: 'ASC', id: 'ASC' },
        })
      : [];

    // Indexa respostas por id da pergunta
    const respostasPorPergunta = new Map<number, (typeof inscricao.respostas)[number]>();
    for (const r of inscricao.respostas ?? []) {
      if (r.pergunta?.id != null) {
        respostasPorPergunta.set(r.pergunta.id, r);
      }
    }

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 60, left: 50, right: 50 },
    });
    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));

    // Header
    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .text('Inscrição PROAE — Detalhe', { align: 'center' })
      .moveDown(0.3);

    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#444444')
      .text(
        `Gerado em ${new Date().toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}`,
        { align: 'center' },
      )
      .fillColor('#000000')
      .moveDown();

    if (edital) {
      doc
        .fontSize(13)
        .font('Helvetica-Bold')
        .text(`Edital: ${edital.titulo_edital}`, { align: 'center' })
        .moveDown(0.5);
    }

    // Dados do aluno (caixa)
    const aluno = inscricao.aluno;
    const usuario = aluno?.usuario;
    const labelLine = (label: string, valor: string | undefined | null) => {
      doc.font('Helvetica-Bold').fontSize(10).text(`${label}: `, {
        continued: true,
      });
      doc.font('Helvetica').fontSize(10).text(valor ? String(valor) : '—');
    };

    doc.moveDown(0.5).font('Helvetica-Bold').fontSize(12).text('Aluno');
    doc.moveDown(0.2);
    labelLine('Nome', usuario?.nome);
    labelLine('CPF', usuario?.cpf);
    labelLine('E-mail', usuario?.email);
    labelLine('Matrícula', aluno?.matricula);
    labelLine('Curso', aluno?.curso);
    labelLine('Campus', aluno?.campus ? String(aluno.campus) : '');
    labelLine(
      'Status da inscrição',
      String(inscricao.status_inscricao ?? '—'),
    );
    labelLine(
      'Situação no edital',
      String(inscricao.status_beneficio_edital ?? '—'),
    );
    labelLine(
      'Data da inscrição',
      inscricao.data_inscricao
        ? new Date(inscricao.data_inscricao).toLocaleDateString('pt-BR')
        : '',
    );

    if (inscricao.observacao_admin) {
      doc.moveDown(0.5).font('Helvetica-Bold').fontSize(11).text('Observação do analista');
      doc.font('Helvetica').fontSize(10).text(inscricao.observacao_admin);
    }

    doc.moveDown(1);

    if (!stepsDoEdital.length) {
      doc.font('Helvetica').fontSize(10).text(
        'Nenhuma pergunta cadastrada no formulário deste edital.',
      );
    } else {
      stepsDoEdital.forEach((step, idxStep) => {
        const titulo = step.texto || `Etapa ${idxStep + 1}`;
        if (doc.y > doc.page.height - 120) {
          doc.addPage();
        }
        doc
          .moveDown(0.5)
          .font('Helvetica-Bold')
          .fontSize(13)
          .fillColor('#0b5394')
          .text(titulo)
          .fillColor('#000000');
        doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
        doc.moveDown(0.3);

        const perguntasOrd = (step.perguntas ?? [])
          .slice()
          .sort((a, b) => {
            const oa = a.ordem ?? 0;
            const ob = b.ordem ?? 0;
            return oa === ob ? a.id - b.id : oa - ob;
          });

        if (!perguntasOrd.length) {
          doc.font('Helvetica').fontSize(10).fillColor('#666666').text(
            '(sem perguntas neste step)',
          ).fillColor('#000000');
          doc.moveDown(0.3);
          return;
        }

        perguntasOrd.forEach((p) => {
          if (doc.y > doc.page.height - 110) {
            doc.addPage();
          }
          const resposta = respostasPorPergunta.get(p.id);
          const valor = formatRespostaParaPdf(resposta);
          const obrigSuffix = p.obrigatoriedade ? ' *' : '';
          doc.font('Helvetica-Bold').fontSize(10).text(
            `${p.pergunta}${obrigSuffix}`,
            { paragraphGap: 2 },
          );
          if (resposta?.invalidada) {
            doc.font('Helvetica-Oblique').fontSize(9).fillColor('#a13a30').text(
              `Status da resposta: invalidada${
                resposta?.parecer ? ` — ${resposta.parecer}` : ''
              }`,
            ).fillColor('#000000');
          } else if (resposta?.validada) {
            doc.font('Helvetica-Oblique').fontSize(9).fillColor('#1c7c3b').text(
              'Status da resposta: validada',
            ).fillColor('#000000');
          }
          doc.font('Helvetica').fontSize(10).text(valor, {
            paragraphGap: 6,
          });
          doc.moveDown(0.1);
        });
      });
    }

    // Footer com paginação
    const totalPages = doc.bufferedPageRange().count;
    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);
      doc
        .fontSize(8)
        .font('Helvetica')
        .text(
          `Página ${i + 1} de ${totalPages}`,
          doc.page.width / 2,
          doc.page.height - 30,
          { align: 'center' },
        );
    }

    doc.end();
    return new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);
    });
  }
}

/**
 * Formata o valor de uma Resposta para texto em uma única string. Cobre
 * texto, opções múltiplas, arquivos (URL) e fallback genérico.
 */
function formatRespostaParaPdf(resposta: any): string {
  if (!resposta) return '—';
  if (resposta.urlArquivo) return `Arquivo: ${resposta.urlArquivo}`;
  if (Array.isArray(resposta.valorOpcoes) && resposta.valorOpcoes.length) {
    return resposta.valorOpcoes.join(', ');
  }
  if (resposta.valorTexto != null && resposta.valorTexto !== '') {
    return String(resposta.valorTexto);
  }
  if (resposta.texto != null && resposta.texto !== '') {
    return String(resposta.texto);
  }
  return '—';
}
