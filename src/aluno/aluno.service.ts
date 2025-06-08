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
import { Inscricao } from 'src/entities/inscricao/inscricao.entity';
import { StatusEdital } from 'src/enum/enumStatusEdital';

@Injectable()
export class AlunoService {
  constructor(
    @InjectRepository(Aluno)
    private readonly alunoRepository: Repository<Aluno>,
    @InjectRepository(Aluno)
    private readonly inscricaoRepository: Repository<Inscricao>,
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
        message: 'Dados do aluno atualizados com sucesso!',
      };
    } catch (e) {
      console.log(e);
      throw new BadRequestException('Erro ao atualizar os dados do aluno');
    }
  }

  async getStudentRegistration(clerkId: string) {
    try {
      const aluno = await this.alunoRepository.findOne({
        where: { id_clerk: clerkId },
        relations: [
          'inscricoes',
          'inscricoes.edital',
          'inscricoes.edital.etapas',
          'inscricoes.documentos',
        ],
      });

      if (!aluno) {
        throw new NotFoundException('Aluno não encontrado.');
      }

      if (!aluno.inscricoes || aluno.inscricoes.length === 0) {
        throw new NotFoundException(
          'O aluno não está inscrito em nenhum edital.',
        );
      }

      return aluno.inscricoes.map((inscricao) => {
        const edital = inscricao.edital;

        const possuiPendencias =
          edital.status_edital === StatusEdital.EM_ANDAMENTO &&
          (!inscricao.documentos || inscricao.documentos.length === 0);

        return {
          edital_id: edital.id,
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
