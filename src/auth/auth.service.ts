import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as cpf from 'validation-br/dist/cpf';
import { Usuario } from '../entities/usuarios/usuario.entity';
import { Aluno } from '../entities/aluno/aluno.entity';
import { Admin } from '../entities/admin/admin.entity';
import { SignupDto } from './dto/signup.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { EmailService } from '../email/email.service';
import { RolesEnum } from '../enum/enumRoles';
import { SignupDtoAdmin } from './dto/siginupAdmin.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    @InjectRepository(Aluno)
    private alunoRepository: Repository<Aluno>,
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usuarioRepository.findOne({
      where: { email },
      relations: ['aluno', 'admin'],
      select: [
        'usuario_id',
        'email',
        'senha_hash',
        'nome',
        'cpf',
        'celular',
        'roles',
      ],
    });

    if (!user) return null;

    const isPasswordValid = await bcrypt.compare(password, user.senha_hash);
    if (!isPasswordValid) return null;

    const { senha_hash, ...result } = user;
    return result;
  }

  async login(user: Usuario) {
    const payload = {
      sub: user.usuario_id,
      email: user.email,
      roles: user.roles,
    };

    return {
      access_token: this.jwtService.sign(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: '1h',
      }),
      user: {
        usuario_id: user.usuario_id,
        email: user.email,
        nome: user.nome,
        roles: user.roles,
      },
    };
  }

  async logout() {
    return { sucesso: true, mensagem: 'Logout realizado com sucesso' };
  }

  async signupAluno(dto: SignupDto) {
    const existingEmail = await this.usuarioRepository.findOne({
      where: { email: dto.email },
    });
    if (existingEmail) throw new BadRequestException('Email já cadastrado');

    const existingCpf = await this.usuarioRepository.findOne({
      where: { cpf: cpf.mask(dto.cpf) },
    });
    if (existingCpf) throw new BadRequestException('CPF já cadastrado');

    const senhaHash = await bcrypt.hash(dto.senha, 12);

    const usuario = this.usuarioRepository.create({
      email: dto.email,
      nome: dto.nome,
      cpf: cpf.mask(dto.cpf),
      celular: dto.celular,
      senha_hash: senhaHash,
      data_nascimento: new Date(dto.data_nascimento),
      roles: [RolesEnum.ALUNO],
    });

    const aluno = this.alunoRepository.create({
      matricula: dto.matricula,
      curso: dto.curso,
      campus: dto.campus,
      data_ingresso: dto.data_ingresso,
      usuario,
    });

    usuario.aluno = aluno;

    const savedUser = await this.usuarioRepository.save(usuario);
    const { senha_hash, ...result } = savedUser;

    return {
      sucesso: true,
      mensagem: 'Aluno cadastrado',
      dados: { aluno: result },
    };
  }

  async updatePassword(userId: number, newPassword: string) {
    const user = await this.usuarioRepository.findOne({
      where: { usuario_id: userId },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    user.senha_hash = await bcrypt.hash(newPassword, 12);
    await this.usuarioRepository.save(user);

    return { sucesso: true, mensagem: 'Senha atualizada com sucesso' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usuarioRepository.findOne({
      where: { email: dto.email },
    });
    if (!user) throw new NotFoundException('Email não encontrado');

    const token = this.jwtService.sign(
      { email: user.email },
      { secret: process.env.JWT_SECRET, expiresIn: '5m' },
    );
    user.passwordResetToken = token;
    user.passwordResetTokenExpires = new Date(Date.now() + 5 * 60 * 1000);

    await this.usuarioRepository.save(user);
    await this.emailService.sendPasswordRecovery(user.email, token);

    return { sucesso: true, mensagem: 'Email de recuperação enviado' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    if (dto.newPassword !== dto.confirmPassword)
      throw new BadRequestException('Senhas não coincidem');

    let user: Usuario;
    try {
      const payload: any = this.jwtService.verify(dto.token, {
        secret: process.env.JWT_SECRET,
      });
      user = await this.usuarioRepository.findOne({
        where: { email: payload.email },
      });
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    if (!user) throw new NotFoundException('Usuário não encontrado');

    user.senha_hash = await bcrypt.hash(dto.newPassword, 12);
    user.passwordResetToken = null;
    user.passwordResetTokenExpires = null;

    await this.usuarioRepository.save(user);
    return { sucesso: true, mensagem: 'Senha alterada com sucesso' };
  }

  async validateToken(token: string) {
    try {
      const payload: any = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });
      const user = await this.usuarioRepository.findOne({
        where: { usuario_id: payload.sub },
        relations: ['aluno', 'admin'],
      });

      if (!user) throw new NotFoundException('Usuário não encontrado');

      return { valid: true, user, roles: user.roles, payload };
    } catch (e) {
      return { valid: false, error: e.message };
    }
  }

  async signupAdmin(dto: SignupDtoAdmin) {
    const emailExistente = await this.usuarioRepository.findOne({
      where: { email: dto.email },
    });
    if (emailExistente) throw new BadRequestException('Email já cadastrado');

    const senhaHash = await bcrypt.hash(dto.senha, 12);
    const usuario = this.usuarioRepository.create({
      email: dto.email,
      nome: dto.nome,
      cpf: dto.cpf,
      celular: dto.celular,
      senha_hash: senhaHash,
      roles: [RolesEnum.ADMIN],
    });

    const admin = this.adminRepository.create({
      usuario,
      aprovado: false,
      approvalToken: this.generateRandomToken(),
      approvalTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
    });

    usuario.admin = admin;

    await this.usuarioRepository.save(usuario);

    const token = this.jwtService.sign(
      { email: usuario.email },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: '2d',
      },
    );

    admin.approvalToken = token;
    admin.approvalTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.adminRepository.save(admin);

    await this.emailService.sendAdminApprovalRequest(usuario.email, token);
    return {
      sucesso: true,
      mensagem: 'Admin cadastrado, aguardando aprovação',
    };
  }
}
