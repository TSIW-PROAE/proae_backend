import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { createClerkClient } from '@clerk/backend';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { Aluno } from '../entities/aluno/aluno.entity';
import { AtualizaDadosAlunoDTO } from './dto/atualizaDadosAluno';
import { Request } from 'express';

@Injectable()
export class AlunoService {
  constructor(
    @InjectRepository(Aluno)
    private alunoRepository: Repository<Aluno>,
  ) { }

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
        success: true,
        data: {
          user: {
            aluno_id: dbUserData.aluno_id,
            firstName: clerkUserData.firstName,
            lastName: clerkUserData.lastName,
            email: clerkUserData.primaryEmailAddress!.emailAddress,
            registrationNumber: clerkUserData.username,
            pronoun: dbUserData.pronome,
            dateOfBirth: dbUserData.data_nascimento,
            course: dbUserData.curso,
            campus: dbUserData.campus,
            cpf: dbUserData.cpf,
            enrollmentDate: dbUserData.data_ingresso,
            identity: dbUserData.identidade,
            phone: dbUserData.celular,
            enrollments: dbUserData.inscricoes,
          },
        },
      };
    } catch (e) {
      console.error(e);
      throw new BadRequestException('Erro ao buscar aluno');
    }
  }
  async updateStudentData(
    id: string,
    atualizaDadosAlunoDTO: AtualizaDadosAlunoDTO,
  ) {
    try {
      const session = await this.clerk.sessions.getSession(id);
      if (!session) {
        throw new BadRequestException('O Token de autenticação não é válido.');
      }
      const alunoClerk = await this.clerk.users.getUser(id);
      if (!alunoClerk) {
        throw new BadRequestException('Usuário não encontrado.');
      }
      const aluno = await this.alunoRepository.findOneBy({ id_clerk: id });
      if (!aluno) {
        throw new NotFoundException('Aluno não encontrado.');
      }
      await this.clerk.users.updateUser(id, {
        firstName: atualizaDadosAlunoDTO.nome,
        lastName: atualizaDadosAlunoDTO.sobrenome,
        username: atualizaDadosAlunoDTO.matricula,
        primaryEmailAddressID: atualizaDadosAlunoDTO.email,
      });
      Object.assign(aluno, {
        pronome: atualizaDadosAlunoDTO.pronome,
        data_nascimento: atualizaDadosAlunoDTO.data_nascimento,
        curso: atualizaDadosAlunoDTO.campus,
        campus: atualizaDadosAlunoDTO.campus,
        data_ingresso: atualizaDadosAlunoDTO.data_ingresso,
        celular: atualizaDadosAlunoDTO.celular,
      });
      await this.alunoRepository.save(aluno);

      return {
        success: true,
        message: 'Dados do aluno atualizados com sucesso!',
      };
    } catch (e) {
      console.log(e);
      throw new BadRequestException('Erro ao atualizar os dados do aluno');
    }
  }
}
