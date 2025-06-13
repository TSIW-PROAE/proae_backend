import { Aluno } from '../entities/aluno/aluno.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { StatusInscricao } from '../enum/enumStatusInscricao';
import { StatusEdital } from '../enum/enumStatusEdital';
import { Beneficio } from '../entities/beneficio/beneficio.entity';
import { Inscricao } from '../entities/inscricao/inscricao.entity';
import { StatusBeneficio } from '../enum/enumStatusBeneficio';
import { CreateBeneficioDto } from './dto/create-beneficio-dto';
import { ReturnBeneficioDto } from './dto/retorno-beneficio.dto';

export class BeneficioService {
  constructor(
    @InjectRepository(Aluno)
    private readonly alunoRepository: Repository<Aluno>,
    @InjectRepository(Beneficio)
    private readonly beneficioRepository: Repository<Beneficio>,
  ) {}

  create(
    createBeneficioDto: CreateBeneficioDto,
    inscricao: Inscricao,
  ): Beneficio {
    const beneficio = new Beneficio();
    beneficio.inscricao = inscricao;
    beneficio.data_inicio = new Date(createBeneficioDto.data_inicio);
    beneficio.status_beneficio =
      createBeneficioDto.status_beneficio ?? StatusBeneficio.ATIVO;
    return beneficio;
  }

  async save(beneficio: Beneficio) {
    return await this.beneficioRepository.save(beneficio);
  }

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

      const beneficios: ReturnBeneficioDto[] = [];

      for (const inscricao of aluno.inscricoes) {
        const editalEncerrado =
          inscricao.edital?.status_edital === StatusEdital.ENCERRADO;
        const inscricaoAprovada =
          inscricao.status_inscricao === StatusInscricao.APROVADA;

        if (editalEncerrado && inscricaoAprovada) {
          if (!inscricao.beneficio) {
            const beneficioDto: CreateBeneficioDto = {
              inscricaoId: inscricao.id,
              data_inicio: new Date().toISOString().split('T')[0],
              status_beneficio: StatusBeneficio.ATIVO,
            };

            const novoBeneficio = this.create(beneficioDto, inscricao);
            await this.save(novoBeneficio);
            inscricao.beneficio = novoBeneficio;
          }

          beneficios.push({
            titulo_beneficio: inscricao.edital.tipo_edital,
            data_inicio: inscricao.beneficio.data_inicio,
            beneficio: inscricao.beneficio.status_beneficio,
          });
        }
      }

      if (beneficios.length === 0) {
        throw new NotFoundException('Nenhum benefício encontrado para o aluno');
      }

      return {
        sucesso: true,
        dados: { beneficios },
      };
    } catch (e) {
      console.error('Erro ao buscar benefícios do aluno', e);
      throw new BadRequestException(
        `Erro ao buscar benefícios do aluno: ${e.message}`,
      );
    }
  }
}
