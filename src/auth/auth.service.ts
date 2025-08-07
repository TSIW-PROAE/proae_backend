import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { QueryFailedError, type Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as cpf from 'validation-br/dist/cpf';
import { Aluno } from '../entities/aluno/aluno.entity';
import { SignupDto } from './dto/signup.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Aluno)
    private alunoRepository: Repository<Aluno>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.alunoRepository.findOne({
      where: { email },
      select: [
        'aluno_id',
        'email',
        'senha_hash',
        'matricula',
        'pronome',
        'data_nascimento',
        'curso',
        'campus',
        'cpf',
        'data_ingresso',
        'celular',
      ],
    });

    if (user && (await bcrypt.compare(password, user.senha_hash))) {
      const { senha_hash, ...result } = user;
      return result;
    }

    return null;
  }

  async login(user: any) {
    const payload = {
      email: user.email,
      sub: user.aluno_id,
      aluno_id: user.aluno_id,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        aluno_id: user.aluno_id,
        email: user.email,
        matricula: user.matricula,
      },
    };
  }

  async signup(alunoSignup: SignupDto) {
    try {
      // Verificar se email já existe
      const existingEmail = await this.alunoRepository.findOne({
        where: { email: alunoSignup.email },
      });

      if (existingEmail) {
        throw new BadRequestException('Email já cadastrado');
      }

      // Verificar se CPF já existe
      const existingCpf = await this.alunoRepository.findOne({
        where: { cpf: cpf.mask(alunoSignup.cpf) },
      });

      if (existingCpf) {
        throw new BadRequestException('CPF já cadastrado');
      }

      // Hash da senha
      const saltRounds = 12;
      const senhaHash = await bcrypt.hash(alunoSignup.senha, saltRounds);

      // Criar aluno
      const novoAluno = this.alunoRepository.create({
        email: alunoSignup.email,
        matricula: alunoSignup.matricula,
        senha_hash: senhaHash,
        pronome: alunoSignup.pronome,
        data_nascimento: new Date(alunoSignup.data_nascimento),
        curso: alunoSignup.curso,
        campus: alunoSignup.campus,
        cpf: cpf.mask(alunoSignup.cpf),
        data_ingresso: alunoSignup.data_ingresso,
        celular: alunoSignup.celular,
      });

      // Salvar no banco
      const alunoSalvo = await this.alunoRepository.save(novoAluno);

      // Retornar sem a senha
      const { senha_hash, ...result } = alunoSalvo;

      return {
        sucesso: true,
        mensagem: 'Cadastro realizado com sucesso',
        dados: {
          aluno: result,
        },
      };
    } catch (e) {
      if (e instanceof QueryFailedError) {
        const err = e as QueryFailedError & { code: string };
        if (err.code === '23505') {
          console.error('Erro de duplicação:', e);
          throw new BadRequestException('Dados já cadastrados');
        }
      }

      console.error('Erro ao realizar o cadastro:', e);
      throw new BadRequestException('Erro ao realizar o cadastro');
    }
  }

  async updatePassword(userId: number, password: string) {
    try {
      console.log('userId', userId);
      const user = await this.alunoRepository.findOne({
        where: { aluno_id: userId },
      });

      if (!user) {
        throw new BadRequestException('Usuário não encontrado');
      }

      // Hash da nova senha
      const saltRounds = 12;
      const senhaHash = await bcrypt.hash(password, saltRounds);

      // Atualizar senha
      await this.alunoRepository.update(
        { aluno_id: userId },
        { senha_hash: senhaHash },
      );

      return {
        sucesso: true,
        mensagem: 'Senha atualizada com sucesso',
      };
    } catch (e) {
      console.error(e);
      throw new BadRequestException('Erro ao atualizar a senha');
    }
  }

  async findUserByEmail(email: string): Promise<Aluno | null> {
    return await this.alunoRepository.findOne({
      where: { email },
      select: [
        'aluno_id',
        'email',
        'matricula',
        'pronome',
        'data_nascimento',
        'curso',
        'campus',
        'cpf',
        'data_ingresso',
        'celular',
      ],
    });
  }

  async googleLogin(user: any) {
    if (user.needsRegistration) {
      // Retorna dados para completar cadastro
      return {
        needsRegistration: true,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        message: 'Complete seu cadastro com as informações adicionais',
      };
    }

    // Login normal
    const payload = {
      email: user.email,
      sub: user.aluno_id,
      aluno_id: user.aluno_id,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        aluno_id: user.aluno_id,
        email: user.email,
        matricula: user.matricula,
      },
    };
  }

  async completeGoogleSignup(completeSignupDto: any) {
    try {
      // Verificar se email já existe
      const existingUser = await this.alunoRepository.findOne({
        where: { email: completeSignupDto.email },
      });

      if (existingUser) {
        throw new BadRequestException('Email já cadastrado');
      }

      // Verificar se matrícula já existe
      const existingMatricula = await this.alunoRepository.findOne({
        where: { matricula: completeSignupDto.matricula },
      });

      if (existingMatricula) {
        throw new BadRequestException('Matrícula já cadastrada');
      }

      // Verificar se CPF já existe
      const existingCpf = await this.alunoRepository.findOne({
        where: { cpf: completeSignupDto.cpf },
      });

      if (existingCpf) {
        throw new BadRequestException('CPF já cadastrado');
      }

      // Criar usuário sem senha (login via Google)
      const novoAluno = this.alunoRepository.create({
        email: completeSignupDto.email,
        matricula: completeSignupDto.matricula,
        senha_hash: 'GOOGLE_OAUTH', // Placeholder para login via Google
        pronome: completeSignupDto.pronome,
        data_nascimento: new Date(completeSignupDto.data_nascimento),
        curso: completeSignupDto.curso,
        campus: completeSignupDto.campus,
        cpf: completeSignupDto.cpf,
        data_ingresso: completeSignupDto.data_ingresso,
        celular: completeSignupDto.celular,
      });

      const alunoSalvo = await this.alunoRepository.save(novoAluno);

      // Criar token JWT automaticamente
      const payload = {
        email: alunoSalvo.email,
        sub: alunoSalvo.aluno_id,
        aluno_id: alunoSalvo.aluno_id,
      };

      return {
        access_token: this.jwtService.sign(payload),
        user: {
          aluno_id: alunoSalvo.aluno_id,
          email: alunoSalvo.email,
          matricula: alunoSalvo.matricula,
        },
        message: 'Cadastro completado com sucesso via Google',
      };
    } catch (error) {
      if (error instanceof QueryFailedError) {
        if (error.message.includes('matricula')) {
          throw new BadRequestException('Matrícula já cadastrada');
        }
        if (error.message.includes('email')) {
          throw new BadRequestException('Email já cadastrado');
        }
        if (error.message.includes('cpf')) {
          throw new BadRequestException('CPF já cadastrado');
        }
      }

      console.error('Erro ao completar cadastro Google:', error);
      throw error instanceof BadRequestException
        ? error
        : new BadRequestException('Erro ao completar cadastro');
    }
  }
}
