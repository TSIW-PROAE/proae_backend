import { Aluno } from '../entities/aluno/aluno.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { StatusInscricao } from '../enum/enumStatusInscricao';
import { StatusEdital } from '../enum/enumStatusEdital';

export class BeneficioService {
  constructor(
    @InjectRepository(Aluno)
    private readonly alunoRepository: Repository<Aluno>,
  ) {}

  async findBenefitsByStudentId(clerkId: string) {
    try {
      const aluno = await this.alunoRepository.findOne({
        where: { id_clerk: clerkId },
        relations: {
          inscricoes: {
            beneficio: true,
            edital: true,
          },
        },
      });

      if (!aluno) {
        throw new NotFoundException('Aluno não encontrado');
      }

      const beneficios = aluno.inscricoes
        .filter(
          (inscricao) =>
            inscricao.beneficio &&
            inscricao.edital &&
            inscricao.edital.status_edital === StatusEdital.ENCERRADO &&
            inscricao.status_inscricao === StatusInscricao.APROVADA,
        )
        .map((inscricao) => ({
          titulo_beneficio: inscricao.edital.tipo_edital,
          beneficio: inscricao.beneficio,
        }));

      if (beneficios.length === 0) {
        throw new NotFoundException('Nenhum benefício encontrado para o aluno');
      }

      return {
        sucesso: true,
        dados: {
          beneficios,
        },
      };
    } catch (error) {
      const e = error as Error;
      console.error('Erro ao buscar benefícios do aluno', error);
      throw new BadRequestException(
        `Erro ao buscar benefícios do aluno: ${e.message}`,
      );
    }
  }
}
