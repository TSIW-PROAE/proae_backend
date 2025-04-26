import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { createClerkClient } from '@clerk/backend';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { Aluno } from '../entities/aluno/aluno.entity';
import {access, unlink} from 'fs/promises';
import * as path from 'path';

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

  async updateImageProfile(clerkId: string, filename: string) {
    const aluno = await this.alunoRepository.findOneBy({ id_clerk: clerkId });
  
    if (!aluno) {
      throw new Error('Aluno não encontrado');
    }

    if(aluno.image) {
      const imagePath = path.join(process.cwd(), 'uploads', aluno.image);

      try{
        await access(imagePath);
        await unlink(imagePath);
        console.log('Imagem antiga deletada com sucesso');
      } catch (err) {
        console.error('Erro ao deletar imagem antiga:', err);
      }
    }
  
    aluno.image = filename;
  
    return this.alunoRepository.save(aluno);
  }
}
