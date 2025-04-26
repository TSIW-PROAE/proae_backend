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
}
