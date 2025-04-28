import { Injectable } from '@nestjs/common';
import { createClerkClient, User } from '@clerk/backend';
import { SignupDto } from './dto/signup.dto';
import { Aluno } from '../entities/aluno/aluno.entity';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import * as cpf from 'validation-br/dist/cpf';

@Injectable()
export class AuthService {
  private clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
  });

  constructor(
    @InjectRepository(Aluno)
    private alunoRepository: Repository<Aluno>,
  ) {}

  async signup(alunoSignup: SignupDto) {
    let alunoClerk: User | undefined;

    try {
      alunoClerk = await this.clerk.users.createUser({
        username: `m-${alunoSignup.matricula}`,
        emailAddress: [alunoSignup.email],
        password: alunoSignup.senha,
        firstName: alunoSignup.nome,
        lastName: alunoSignup.sobrenome,
      });

      const alunoDb = this.alunoRepository.create({
        id_clerk: alunoClerk.id,
        pronome: alunoSignup.pronome,
        data_nascimento: alunoSignup.data_nascimento,
        curso: alunoSignup.curso,
        campus: alunoSignup.campus,
        cpf: cpf.mask(alunoSignup.cpf),
        data_ingresso: alunoSignup.data_ingresso,
        celular: alunoSignup.celular,
      });

      await this.alunoRepository.insert(alunoDb);

      return {
        sucesso: true,
        mensagem: 'Cadastro realizado com sucesso',
        dados: {
          aluno: {
            clerk_id: alunoClerk.id,
            email: alunoClerk.emailAddresses[0].emailAddress,
            nome: alunoClerk.firstName,
            sobrenome: alunoClerk.lastName,
            matricula: alunoClerk.username,
            pronome: alunoDb.pronome,
            data_nascimento: alunoDb.data_nascimento,
            curso: alunoDb.curso,
            campus: alunoDb.campus,
            cpf: alunoDb.cpf,
            data_ingresso: alunoDb.data_ingresso,
            celular: alunoDb.celular,
          },
        },
      };
    } catch (e) {
      console.error(e);

      if (alunoClerk && alunoClerk.id) {
        try {
          await this.clerk.users.deleteUser(alunoClerk.id);
        } catch (e) {
          console.error('Erro ao deletar usuário do Clerk:', e);
        }
      }

      throw new BadRequestException('Erro ao realizar o cadastro');
    }
  }
}
