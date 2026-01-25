import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import PDFDocument from 'pdfkit';
import { Inscricao } from '../entities/inscricao/inscricao.entity';
import { StatusInscricao } from '../enum/enumStatusInscricao';
import { Edital } from '../entities/edital/edital.entity';

@Injectable()
export class PdfService {
  constructor(
    @InjectRepository(Inscricao)
    private readonly inscricaoRepository: Repository<Inscricao>,
    @InjectRepository(Edital)
    private readonly editalRepository: Repository<Edital>,
  ) {}

  async generateAprovadosPdf(editalId?: number): Promise<Buffer> {
    // Buscar inscrições aprovadas
    const queryBuilder = this.inscricaoRepository
      .createQueryBuilder('inscricao')
      .leftJoinAndSelect('inscricao.aluno', 'aluno')
      .leftJoinAndSelect('aluno.usuario', 'usuario')
      .leftJoinAndSelect('inscricao.vagas', 'vagas')
      .leftJoinAndSelect('vagas.edital', 'edital')
      .where('inscricao.status_inscricao = :status', {
        status: StatusInscricao.APROVADA,
      });

    // Se editalId for fornecido, filtrar por edital
    if (editalId) {
      const edital = await this.editalRepository.findOne({
        where: { id: editalId },
      });

      if (!edital) {
        throw new NotFoundException('Edital não encontrado');
      }

      queryBuilder.andWhere('edital.id = :editalId', { editalId });
    }

    const inscricoes = await queryBuilder
      .orderBy('usuario.nome', 'ASC')
      .getMany();

    if (inscricoes.length === 0) {
      throw new NotFoundException('Nenhum estudante aprovado encontrado');
    }

    // Criar PDF
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));

    // Título
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('Relatório de Estudantes Aprovados', { align: 'center' })
      .moveDown();

    // Informações do edital (se filtrado por edital)
    if (editalId && inscricoes.length > 0) {
      const edital = inscricoes[0].vagas.edital;
      doc
        .fontSize(14)
        .font('Helvetica')
        .text(`Edital: ${edital.titulo_edital}`, { align: 'center' })
        .moveDown(0.5);
    }

    // Data de geração
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(
        `Gerado em: ${new Date().toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}`,
        { align: 'center' },
      )
      .moveDown(2);

    // Total de aprovados
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text(`Total de Estudantes Aprovados: ${inscricoes.length}`, {
        align: 'center',
      })
      .moveDown(2);

    // Tabela de estudantes
    let yPosition = doc.y;
    const startY = yPosition;
    const pageWidth = doc.page.width - 100; // Margens
    const colWidths = {
      numero: 40,
      nome: 200,
      matricula: 100,
      email: 180,
      curso: 150,
      campus: 100,
    };

    // Cabeçalho da tabela
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('#', 50, yPosition)
      .text('Nome', 50 + colWidths.numero, yPosition)
      .text('Matrícula', 50 + colWidths.numero + colWidths.nome, yPosition)
      .text('Email', 50 + colWidths.numero + colWidths.nome + colWidths.matricula, yPosition)
      .text('Curso', 50 + colWidths.numero + colWidths.nome + colWidths.matricula + colWidths.email, yPosition)
      .text('Campus', 50 + colWidths.numero + colWidths.nome + colWidths.matricula + colWidths.email + colWidths.curso, yPosition);

    // Linha separadora
    yPosition += 15;
    doc
      .moveTo(50, yPosition)
      .lineTo(pageWidth + 50, yPosition)
      .stroke();

    yPosition += 10;

    // Dados dos estudantes
    inscricoes.forEach((inscricao, index) => {
      // Verificar se precisa de nova página
      if (yPosition > doc.page.height - 100) {
        doc.addPage();
        yPosition = 50;

        // Repetir cabeçalho
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .text('#', 50, yPosition)
          .text('Nome', 50 + colWidths.numero, yPosition)
          .text('Matrícula', 50 + colWidths.numero + colWidths.nome, yPosition)
          .text('Email', 50 + colWidths.numero + colWidths.nome + colWidths.matricula, yPosition)
          .text('Curso', 50 + colWidths.numero + colWidths.nome + colWidths.matricula + colWidths.email, yPosition)
          .text('Campus', 50 + colWidths.numero + colWidths.nome + colWidths.matricula + colWidths.email + colWidths.curso, yPosition);

        yPosition += 15;
        doc
          .moveTo(50, yPosition)
          .lineTo(pageWidth + 50, yPosition)
          .stroke();
        yPosition += 10;
      }

      const aluno = inscricao.aluno;
      const usuario = aluno.usuario;

      doc
        .fontSize(9)
        .font('Helvetica')
        .text(`${index + 1}`, 50, yPosition)
        .text(usuario.nome || '-', 50 + colWidths.numero, yPosition, {
          width: colWidths.nome,
          ellipsis: true,
        })
        .text(aluno.matricula || '-', 50 + colWidths.numero + colWidths.nome, yPosition, {
          width: colWidths.matricula,
          ellipsis: true,
        })
        .text(usuario.email || '-', 50 + colWidths.numero + colWidths.nome + colWidths.matricula, yPosition, {
          width: colWidths.email,
          ellipsis: true,
        })
        .text(aluno.curso || '-', 50 + colWidths.numero + colWidths.nome + colWidths.matricula + colWidths.email, yPosition, {
          width: colWidths.curso,
          ellipsis: true,
        })
        .text(aluno.campus || '-', 50 + colWidths.numero + colWidths.nome + colWidths.matricula + colWidths.email + colWidths.curso, yPosition, {
          width: colWidths.campus,
          ellipsis: true,
        });

      yPosition += 15;
    });

    // Rodapé
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

    // Aguardar o PDF ser gerado
    return new Promise((resolve, reject) => {
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });

      doc.on('error', reject);
    });
  }
}
