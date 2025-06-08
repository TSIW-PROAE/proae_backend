import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { createClerkClient } from '@clerk/backend';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { Aluno } from '../entities/aluno/aluno.entity';
import { AtualizaDadosAlunoDTO } from './dto/atualizaDadosAluno';
import { StatusDocumento } from '../enum/statusDocumento';

@Injectable()
export class AlunoService {
  constructor(
    @InjectRepository(Aluno)
    private alunoRepository: Repository<Aluno>,
  ) {}

  private clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
  });

  async findByClerkId(id: string) {
    try {
      const clerkUserData = await this.clerk.users.getUser(id);

      if (!clerkUserData) {
        throw new NotFoundException('Aluno não encontrado');
      }

      const dbUserData = await this.alunoRepository.findOneBy({
        id_clerk: id,
      });

      if (!dbUserData) {
        throw new NotFoundException('Aluno não encontrado');
      }

      return {
        sucesso: true,
        dados: {
          aluno: {
            aluno_id: dbUserData.aluno_id,
            nome: clerkUserData.firstName,
            sobrenome: clerkUserData.lastName,
            email: clerkUserData.primaryEmailAddress!.emailAddress,
            matricula: clerkUserData.username,
            pronome: dbUserData.pronome,
            data_nascimento: dbUserData.data_nascimento,
            curso: dbUserData.curso,
            campus: dbUserData.campus,
            cpf: dbUserData.cpf,
            data_ingresso: dbUserData.data_ingresso,
            celular: dbUserData.celular,
            inscricoes: dbUserData.inscricoes,
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
  async hasReprovadoDocuments(clerkId: string): Promise<boolean> {
    try {
      const aluno = await this.alunoRepository.findOne({
        where: { id_clerk: clerkId },
        relations: ['inscricoes', 'inscricoes.documentos'],
      });

      if (!aluno) {
        return false;
      }

      for (const inscricao of aluno.inscricoes) {
        const hasReprovado = inscricao.documentos.some(
          doc => doc.status_documento === StatusDocumento.REPROVADO
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
    id: string,
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

      const alunoClerk = await this.clerk.users.getUser(id);
      if (!alunoClerk) {
        throw new NotFoundException('Aluno não encontrado.');
      }
      const aluno = await this.alunoRepository.findOneBy({ id_clerk: id });
      if (!aluno) {
        throw new NotFoundException('Aluno não encontrado.');
      }
      const emailNovo = atualizaDadosAlunoDTO.email;
      const emailAtual = alunoClerk.primaryEmailAddress?.emailAddress;
      const novoEmailDiferente = emailNovo && emailNovo !== emailAtual;

      let primaryEmailId = alunoClerk.primaryEmailAddress?.id;

      if (novoEmailDiferente) {
        const emailExistente = alunoClerk.emailAddresses.find(
          (email) => email.emailAddress === emailNovo,
        );

        if (!emailExistente) {
          throw new BadRequestException('Novo email não validado.');
        }

        primaryEmailId = emailExistente.id;
      }

      await this.clerk.users.updateUser(id, {
        firstName: atualizaDadosAlunoDTO.nome,
        lastName: atualizaDadosAlunoDTO.sobrenome,
        username: `m-${atualizaDadosAlunoDTO.matricula}`,
        primaryEmailAddressID: primaryEmailId,
      });
      Object.assign(aluno, {
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
  async checkUpdatePermission(clerkId: string) {
    try {
      const hasPermission = await this.hasReprovadoDocuments(clerkId);

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
      throw new BadRequestException(`Erro ao verificar permissões: ${e.message}`);
    }
  }
}
