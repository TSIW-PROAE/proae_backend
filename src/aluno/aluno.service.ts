import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { StatusEdital } from 'src/enum/enumStatusEdital';
import type { Repository } from 'typeorm';
import { Aluno } from '../entities/aluno/aluno.entity';
import { Inscricao } from '../entities/inscricao/inscricao.entity';
import { StatusDocumento } from '../enum/statusDocumento';
import { AtualizaDadosAlunoDTO } from './dto/atualizaDadosAluno';

@Injectable()
export class AlunoService {
  constructor(
    @InjectRepository(Aluno)
    private readonly alunoRepository: Repository<Aluno>,
  ) {}

  async findByUserId(userId: number) {
    try {
      const aluno = await this.alunoRepository.findOne({
        where: { aluno_id: userId },
        relations: ['inscricoes'],
      });

      if (!aluno) {
        throw new NotFoundException('Aluno não encontrado');
      }

      return {
        sucesso: true,
        dados: {
          aluno: {
            aluno_id: aluno.aluno_id,
            email: aluno.email,
            matricula: aluno.matricula,
            pronome: aluno.pronome,
            data_nascimento: aluno.data_nascimento,
            curso: aluno.curso,
            campus: aluno.campus,
            cpf: aluno.cpf,
            data_ingresso: aluno.data_ingresso,
            celular: aluno.celular,
            inscricoes: aluno.inscricoes,
          },
        },
      };
    } catch (e) {
      console.error(e);
      throw new BadRequestException('Erro ao buscar aluno');
    }
  }

  /**
   * Check if a student has any documents with "REPROVADO" status
   */
  async hasReprovadoDocuments(userId: string): Promise<boolean> {
    try {
      const aluno = await this.alunoRepository.findOne({
        where: { aluno_id: parseInt(userId) },
        relations: ['inscricoes', 'inscricoes.documentos'],
      });

      if (!aluno) {
        return false;
      }

      for (const inscricao of aluno.inscricoes) {
        const hasReprovado = inscricao.documentos.some(
          (doc) => doc.status_documento === StatusDocumento.REPROVADO,
        );
        if (hasReprovado) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Erro ao verificar documentos reprovados', error);
      return false;
    }
  }

  async updateStudentData(
    userId: number,
    atualizaDadosAlunoDTO: AtualizaDadosAlunoDTO,
  ) {
    try {
      // Check if the request body is empty
      const hasAnyData = Object.values(atualizaDadosAlunoDTO).some(
        (value) => value !== undefined && value !== null && value !== '',
      );

      if (!hasAnyData) {
        throw new BadRequestException('Dados para atualização não fornecidos.');
      }

      const aluno = await this.alunoRepository.findOneBy({
        aluno_id: userId,
      });

      if (!aluno) {
        throw new NotFoundException('Aluno não encontrado.');
      }

      // Verificar se email já existe (se foi fornecido)
      if (
        atualizaDadosAlunoDTO.email &&
        atualizaDadosAlunoDTO.email !== aluno.email
      ) {
        const emailExistente = await this.alunoRepository.findOne({
          where: { email: atualizaDadosAlunoDTO.email },
        });

        if (emailExistente) {
          throw new BadRequestException('Email já está em uso.');
        }
      }

      // Atualizar dados do aluno
      Object.assign(aluno, {
        email: atualizaDadosAlunoDTO.email || aluno.email,
        matricula: atualizaDadosAlunoDTO.matricula || aluno.matricula,
        pronome: atualizaDadosAlunoDTO.pronome || aluno.pronome,
        data_nascimento:
          atualizaDadosAlunoDTO.data_nascimento || aluno.data_nascimento,
        curso: atualizaDadosAlunoDTO.curso || aluno.curso,
        campus: atualizaDadosAlunoDTO.campus || aluno.campus,
        data_ingresso:
          atualizaDadosAlunoDTO.data_ingresso || aluno.data_ingresso,
        celular: atualizaDadosAlunoDTO.celular || aluno.celular,
      });

      await this.alunoRepository.save(aluno);

      return {
        success: true,
        message: 'Dados do aluno atualizados com sucesso!',
      };
    } catch (e) {
      console.log(e);
      if (e instanceof ForbiddenException || e instanceof NotFoundException) {
        throw e;
      }
      throw new BadRequestException('Erro ao atualizar os dados do aluno');
    }
  }

  /**
   * Check if student can update their data
   */
  async checkUpdatePermission(userId: number) {
    try {
      const hasPermission = await this.hasReprovadoDocuments(userId.toString());

      return {
        success: true,
        canUpdate: hasPermission,
        message: hasPermission
          ? 'Você pode editar seus dados para reenvio'
          : 'Você não possui documentos reprovados. Edição de dados não permitida.',
      };
    } catch (error) {
      const e = error as Error;
      console.error('Erro ao verificar permissão de atualização', error);
      throw new BadRequestException(
        `Erro ao verificar permissões: ${e.message}`,
      );
    }
  }

  async getStudentRegistration(userId: number) {
    try {
      const aluno = await this.alunoRepository.findOne({
        where: { aluno_id: userId },
        relations: {
          inscricoes: {
            edital: {
              etapas: true,
            },
            documentos: true,
          },
        },
      });

      if (!aluno) {
        throw new NotFoundException('Aluno não encontrado.');
      }

      if (!aluno.inscricoes || aluno.inscricoes.length === 0) {
        throw new NotFoundException(
          'O aluno não está inscrito em nenhum edital.',
        );
      }

      return aluno.inscricoes.map((inscricao: Inscricao) => {
        const edital = inscricao.edital;

        const possuiPendencias =
          (edital.status_edital === StatusEdital.ABERTO ||
            edital.status_edital === StatusEdital.EM_ANDAMENTO) &&
          inscricao.documentos &&
          inscricao.documentos.some(
            (doc) =>
              doc.status_documento !== StatusDocumento.APROVADO &&
              doc.status_documento !== StatusDocumento.REPROVADO,
          );

        // const possuiPendencias =
        //   edital.status_edital === StatusEdital.EM_ANDAMENTO &&
        //   (!inscricao.documentos || inscricao.documentos.length === 0);

        return {
          edital_id: edital.id,
          inscricao_id: inscricao.id,
          titulo_edital: edital.titulo_edital,
          status_edital: edital.status_edital,
          etapas_edital: edital.etapas,
          status_inscricao: inscricao.status_inscricao,
          possui_pendencias: possuiPendencias,
        };
      });
    } catch (e) {
      console.log(e);
      throw new BadRequestException('Erro ao retornar inscricoes do aluno.');
    }
  }
}
