import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { ISignup, IUpdatePassword } from '../auth.service';
import { SignupDto } from '../dto/signup.dto';
import { Repository } from 'typeorm';
import { Aluno } from '@/src/entities/aluno/aluno.entity';
import { SignInDto } from '../dto/signIn.dto';

@Injectable()
export class AuthServiceJwt implements ISignup, IUpdatePassword {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(Aluno)
    private repository: Repository<Aluno>,
  ) {}


  async signUp(signUpDto: SignupDto): Promise<string> {
    signUpDto.senha = await bcrypt.hash(signUpDto.senha, 10);
    await this.repository.save(signUpDto);
    return 'Aluno cadastrado com sucesso';
  }

  async signIn(signInDto: SignInDto): Promise<string> {
    const user = await this.repository.findOne({ where: { email: signInDto.email } });

    if (!user) {
      throw new UnauthorizedException('Email ou senha inválida');
    }

    const isMatch = await bcrypt.compare(signInDto.senha, user.senha);

    if (!isMatch) {
      throw new UnauthorizedException('Email ou senha inválida');
    }

    const payload = {
      id: user.aluno_id,
      email: user.email,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return accessToken;
  }

  async updatePassword(id: number, newPassword: string): Promise<any> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await this.repository.update(id, { senha: hashedPassword });
    
    return { success: true, message: 'Senha atualizada com sucesso' };
  }
}