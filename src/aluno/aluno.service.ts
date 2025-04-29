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

  async updateStudentData(
    id: string,
    atualizaDadosAlunoDTO: AtualizaDadosAlunoDTO,
  ) {
    try {
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
        message: 'Dados do aluno atualizados com sucesso!',
      };
    } catch (e) {
      console.log(e);
      throw new BadRequestException('Erro ao atualizar os dados do aluno');
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
