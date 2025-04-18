import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { createClerkClient } from '@clerk/backend';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { Aluno } from '../entities/aluno/aluno.entity';

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(Aluno)
    private studentRepository: Repository<Aluno>,
  ) {}

  private clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
  });

  async findByClerkId(id: string) {
    try {
      const clerkUserData = await this.clerk.users.getUser(id);

      if (!clerkUserData) {
        throw new NotFoundException('Usuário não encontrado');
      }

      const dbUserData = await this.studentRepository.findOneBy({
        id_clerk: id,
      });

      if (!dbUserData) {
        throw new NotFoundException('Usuário não encontrado');
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
      throw new BadRequestException('Erro ao buscar usuário');
    }
  }
}
