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

  async findById(id: number): Promise<Aluno | null> {
    try {
      return await this.alunoRepository.findOne({
        where: { aluno_id: id },
        relations: {
          inscricoes: {
            edital: {
              etapas: true,
            },
          documentos: true,
          },
        },
      });
    } catch (error) {
      console.error(error);
      throw new BadRequestException('Erro ao buscar aluno');
    }
  }

  async findByEmail(email: string): Promise<Aluno | null> {
    try {
      return await this.alunoRepository.findOne({
        where: { email },
        relations: {
          inscricoes: {
            edital: {
              etapas: true,
            },
          documentos: true,
          },
        },
      });
    } catch (error) {
      console.error(error);
      throw new BadRequestException('Erro ao buscar aluno');
    }
  }

  /**
   * Check if a student has any documents with "REPROVADO" status
   */
  async hasReprovadoDocuments(id: number): Promise<boolean> {
    try {
      const aluno = await (await this.findById(id));

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
    id: number,
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
      
      const aluno = await this.alunoRepository.findOneBy({ aluno_id: id });
      
      if (!aluno) {
        throw new NotFoundException('Aluno não encontrado.');
      }
      const emailNovo = atualizaDadosAlunoDTO.email;
      const emailAtual = aluno.email;
      const novoEmailDiferente = emailNovo && emailNovo !== emailAtual;

      if (novoEmailDiferente) {
        const emailExistente = await this.findByEmail(emailNovo);

        if (!emailExistente) {
          throw new BadRequestException('Novo email não validado.');
        }
      }

      Object.assign(aluno, {
        email: emailNovo,
        matricula: atualizaDadosAlunoDTO.matricula,
        nome: atualizaDadosAlunoDTO.nome,
        sobrenome: atualizaDadosAlunoDTO.sobrenome,
        pronome: atualizaDadosAlunoDTO.pronome,
        data_nascimento: atualizaDadosAlunoDTO.data_nascimento,
        curso: atualizaDadosAlunoDTO.curso,
        campus: atualizaDadosAlunoDTO.campus,
        data_ingresso: atualizaDadosAlunoDTO.data_ingresso,
        celular: atualizaDadosAlunoDTO.celular,
      });

      await this.alunoRepository.save(aluno);

      return {
        success: true,
        message: 'Dados do aluno atualizados com sucesso para reenvio!',
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
  async checkUpdatePermission(id: number) {
    try {
      const hasPermission = await this.hasReprovadoDocuments(id);

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

  async getStudentRegistration(id: number) {
    try {
      const aluno = await this.findById(id);

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
              doc.status_documento !== StatusDocumento.REPROVADO
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
