import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
/** pdfkit usa module.exports (sem default) — import default quebra em runtime (default is not a constructor). */
// eslint-disable-next-line @typescript-eslint/no-require-imports
import PDFDocument = require('pdfkit');
import { Repository } from 'typeorm';
import type { PdfRendererPort } from '../../../core/application/utilities/ports/pdf-renderer.port';
import { Edital } from 'src/infrastructure/persistence/typeorm/entities/edital/edital.entity';
import { Inscricao } from 'src/infrastructure/persistence/typeorm/entities/inscricao/inscricao.entity';
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
}
