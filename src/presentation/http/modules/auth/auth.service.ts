import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import * as cpf from 'validation-br/dist/cpf';
import { Repository } from 'typeorm';
import type { EmailSenderPort } from 'src/core/application/utilities/ports/email-sender.port';
import { EMAIL_SENDER } from 'src/core/application/utilities/utility.tokens';
import { RolesEnum } from 'src/core/shared-kernel/enums/enumRoles';
import { Admin } from 'src/infrastructure/persistence/typeorm/entities/admin/admin.entity';
import { Aluno } from 'src/infrastructure/persistence/typeorm/entities/aluno/aluno.entity';
import { Usuario } from 'src/infrastructure/persistence/typeorm/entities/usuarios/usuario.entity';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SignupDtoAdmin } from './dto/siginupAdmin.dto';
import { SignupDto } from './dto/signup.dto';

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
    @Inject(EMAIL_SENDER)
    private emailService: EmailSenderPort,
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

    const full = await this.usuarioRepository.findOne({
      where: { usuario_id: user.usuario_id },
      relations: ['aluno', 'admin'],
    });

    if (full?.roles?.includes(RolesEnum.ADMIN) && full.admin) {
      if (!full.admin.aprovado) {
        throw new UnauthorizedException(
          'Seu cadastro está aguardando aprovação. Você receberá um email quando for aprovado.',
        );
      }
    }

    if (
      full?.aluno &&
      !full.aluno.cadastroEmailConfirmado &&
      full.admin?.aprovado !== true
    ) {
      throw new UnauthorizedException(
        'Confirme seu email para ativar o cadastro de estudante. Verifique sua caixa de entrada e o spam.',
      );
    }

    const { senha_hash, ...result } = user;
    return result;
  }

  async login(user: Usuario) {
    const userFull = await this.usuarioRepository.findOne({
      where: { usuario_id: user.usuario_id },
      relations: ['admin', 'aluno'],
    });

    if (
      userFull?.roles?.includes(RolesEnum.ADMIN) &&
      userFull.admin
    ) {
      if (!userFull.admin.aprovado) {
        throw new UnauthorizedException(
          'Seu cadastro está aguardando aprovação. Você receberá um email quando for aprovado.',
        );
      }
    }

    if (
      userFull?.aluno &&
      !userFull.aluno.cadastroEmailConfirmado &&
      userFull.admin?.aprovado !== true
    ) {
      throw new UnauthorizedException(
        'Confirme seu email para ativar o cadastro de estudante. Verifique sua caixa de entrada e o spam.',
      );
    }

    // Sincroniza roles com a realidade do banco antes de emitir o JWT
    const rolesReais: RolesEnum[] = [];
    if (userFull?.aluno) rolesReais.push(RolesEnum.ALUNO);
    if (userFull?.admin) rolesReais.push(RolesEnum.ADMIN);
    const rolesBanco = userFull?.roles ?? [];
    const rolesSincronizados = rolesBanco.length !== rolesReais.length ||
      !rolesBanco.every((r) => rolesReais.includes(r))
      ? rolesReais
      : rolesBanco;
    if (rolesSincronizados !== rolesBanco && userFull) {
      userFull.roles = rolesSincronizados;
      await this.usuarioRepository.update(userFull.usuario_id, { roles: rolesSincronizados });
    }

    const payload = {
      sub: user.usuario_id,
      email: user.email,
      roles: rolesSincronizados,
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
        roles: rolesSincronizados,
        adminAprovado: userFull?.admin?.aprovado ?? null,
        hasAluno: !!userFull?.aluno,
      },
    };
  }

  async logout() {
    return { sucesso: true, mensagem: 'Logout realizado com sucesso' };
  }

  /**
   * Após criar/vincular perfil de aluno: quem já tem admin aprovado não precisa confirmar email;
   * caso contrário envia link para o próprio estudante.
   */
  async aplicarConfirmacaoEmailPosCadastroAluno(
    usuarioId: string,
  ): Promise<{ aguardando_confirmacao_email: boolean }> {
    const usuario = await this.usuarioRepository.findOne({
      where: { usuario_id: usuarioId },
      relations: ['aluno', 'admin'],
    });
    if (!usuario?.aluno) {
      throw new InternalServerErrorException(
        'Registro de aluno não encontrado após o cadastro.',
      );
    }
    const adminAprovado = usuario.admin?.aprovado === true;
    usuario.aluno.cadastroEmailConfirmado = adminAprovado;
    await this.alunoRepository.save(usuario.aluno);
    if (!adminAprovado) {
      const backendUrl = (
        process.env.BACKEND_URL || 'http://localhost:3000'
      ).replace(/\/+$/, '');
      const token = this.jwtService.sign(
        { sub: usuario.usuario_id, typ: 'aluno_confirm' },
        {
          secret: process.env.JWT_SECRET || 'seu_secret_jwt_aqui',
          expiresIn: '48h',
        },
      );
      const confirmUrl = `${backendUrl}/auth/confirm-cadastro-aluno?token=${encodeURIComponent(token)}`;
      await this.emailService.sendAlunoCadastroConfirmation(
        usuario.email,
        confirmUrl,
      );
    }
    return { aguardando_confirmacao_email: !adminAprovado };
  }

  async confirmAlunoCadastro(token: string) {
    let payload: { sub: string; typ?: string };
    try {
      payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'seu_secret_jwt_aqui',
      }) as { sub: string; typ?: string };
    } catch {
      throw new BadRequestException('Link inválido ou expirado.');
    }
    if (payload.typ !== 'aluno_confirm' || !payload.sub) {
      throw new BadRequestException('Link inválido.');
    }
    const usuario = await this.usuarioRepository.findOne({
      where: { usuario_id: payload.sub },
      relations: ['aluno'],
    });
    if (!usuario?.aluno) {
      throw new BadRequestException('Cadastro de estudante não encontrado.');
    }
    usuario.aluno.cadastroEmailConfirmado = true;
    await this.alunoRepository.save(usuario.aluno);
    return {
      sucesso: true,
      mensagem: 'Email confirmado! Você já pode fazer login no portal do estudante.',
    };
  }

  async signupAluno(dto: SignupDto) {
    try {
      const existingUsuario = await this.usuarioRepository.findOne({
        where: { email: dto.email },
        select: ['usuario_id', 'email', 'senha_hash', 'nome', 'cpf', 'celular', 'roles', 'data_nascimento'],
        relations: ['aluno', 'admin'],
      });

      if (existingUsuario) {
        if (existingUsuario.aluno) {
          throw new BadRequestException(
            'Uma conta só pode ter um cadastro de aluno. Você já possui perfil de estudante nesta conta.',
          );
        }
        const senhaOk = await bcrypt.compare(dto.senha, existingUsuario.senha_hash);
        if (!senhaOk) {
          throw new BadRequestException(
            'Senha incorreta. Use a senha da sua conta para vincular o cadastro de aluno.',
          );
        }
        const matriculaEmUso = await this.alunoRepository.findOne({
          where: { matricula: dto.matricula },
          relations: ['usuario'],
        });
        if (matriculaEmUso) {
          // Matrícula já existe. O usuário autenticado está reivindicando-a.
          // Transfere o perfil de aluno para a conta atual.
          const usuarioAnterior = matriculaEmUso.usuario;
          matriculaEmUso.usuario = existingUsuario;
          matriculaEmUso.curso = dto.curso;
          matriculaEmUso.campus = dto.campus;
          matriculaEmUso.data_ingresso = dto.data_ingresso;
          await this.alunoRepository.save(matriculaEmUso);
          const rolesAtualizados = existingUsuario.roles?.includes(RolesEnum.ALUNO)
            ? existingUsuario.roles
            : [...(existingUsuario.roles || []), RolesEnum.ALUNO];
          existingUsuario.roles = rolesAtualizados;
          await this.usuarioRepository.save(existingUsuario);
          // Limpa role ALUNO da conta antiga
          if (usuarioAnterior?.usuario_id && usuarioAnterior.usuario_id !== existingUsuario.usuario_id) {
            const rolesAntigo = (usuarioAnterior.roles ?? []) as RolesEnum[];
            const novoRoles = rolesAntigo.filter((r): r is RolesEnum => r !== RolesEnum.ALUNO);
            await this.usuarioRepository.update(usuarioAnterior.usuario_id, {
              roles: novoRoles as RolesEnum[],
            });
          }
          const { aguardando_confirmacao_email } =
            await this.aplicarConfirmacaoEmailPosCadastroAluno(
              existingUsuario.usuario_id,
            );
          return {
            sucesso: true,
            mensagem: aguardando_confirmacao_email
              ? 'Enviamos um link de confirmação para seu email institucional. Abra o link para ativar seu cadastro de estudante.'
              : 'Cadastro de aluno vinculado à sua conta com sucesso.',
            aguardando_confirmacao_email,
            dados: {
              aluno: {
                usuario_id: existingUsuario.usuario_id,
                aluno_id: matriculaEmUso.aluno_id,
                matricula: matriculaEmUso.matricula,
                curso: matriculaEmUso.curso,
                campus: matriculaEmUso.campus,
                data_ingresso: matriculaEmUso.data_ingresso,
              },
            },
          };
        }
        const novoAluno = this.alunoRepository.create({
          matricula: dto.matricula,
          curso: dto.curso,
          campus: dto.campus,
          data_ingresso: dto.data_ingresso,
          usuario: existingUsuario,
        });
        await this.alunoRepository.save(novoAluno);
        const rolesAtualizados = existingUsuario.roles?.includes(RolesEnum.ALUNO)
          ? existingUsuario.roles
          : [...(existingUsuario.roles || []), RolesEnum.ALUNO];
        existingUsuario.roles = rolesAtualizados;
        await this.usuarioRepository.save(existingUsuario);
        const { aguardando_confirmacao_email: aguardandoNovo } =
          await this.aplicarConfirmacaoEmailPosCadastroAluno(
            existingUsuario.usuario_id,
          );
        return {
          sucesso: true,
          mensagem: aguardandoNovo
            ? 'Enviamos um link de confirmação para seu email institucional. Abra o link para ativar seu cadastro de estudante.'
            : 'Cadastro de aluno vinculado à sua conta com sucesso.',
          aguardando_confirmacao_email: aguardandoNovo,
          dados: { aluno: { usuario_id: existingUsuario.usuario_id, ...novoAluno } },
        };
      }

      const existingCpf = await this.usuarioRepository.findOne({
        where: { cpf: cpf.mask(dto.cpf) },
      });
      if (existingCpf) throw new BadRequestException('CPF já cadastrado');

      const matriculaEmUso = await this.alunoRepository.findOne({
        where: { matricula: dto.matricula },
      });
      if (matriculaEmUso) {
        throw new BadRequestException(
          'Esta matrícula já está cadastrada. Se você já tem conta, faça login e use a opção de completar cadastro de aluno.',
        );
      }

      const senhaHash = await bcrypt.hash(dto.senha, 12);

      // Importante: o lado "dono" do relacionamento OneToOne (com @JoinColumn())
      // está na entidade `Aluno`. Então, para garantir que o aluno fique realmente
      // associado ao `usuario_id`, precisamos persistir a relação explicitamente.
      const usuario = this.usuarioRepository.create({
        email: dto.email,
        nome: dto.nome,
        cpf: cpf.mask(dto.cpf),
        celular: dto.celular,
        senha_hash: senhaHash,
        data_nascimento: new Date(dto.data_nascimento),
        roles: [RolesEnum.ALUNO],
      });

      const savedUser = await this.usuarioRepository.save(usuario);

      const aluno = this.alunoRepository.create({
        matricula: dto.matricula,
        curso: dto.curso,
        campus: dto.campus,
        data_ingresso: dto.data_ingresso,
        usuario: savedUser,
      });
      await this.alunoRepository.save(aluno);

      const { aguardando_confirmacao_email: aguardandoNovoUser } =
        await this.aplicarConfirmacaoEmailPosCadastroAluno(savedUser.usuario_id);

      const { senha_hash, ...result } = savedUser;

      return {
        sucesso: true,
        mensagem: aguardandoNovoUser
          ? 'Cadastro recebido! Enviamos um link de confirmação para seu email institucional.'
          : 'Aluno cadastrado com sucesso.',
        aguardando_confirmacao_email: aguardandoNovoUser,
        dados: { aluno: result },
      };
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error?.code === '23505') {
        const detail = String(error.detail ?? '').toLowerCase();
        const constraint = String(error.constraint ?? '').toLowerCase();
        if (constraint.includes('matricula') || detail.includes('matricula')) {
          throw new BadRequestException(
            'Esta matrícula já está cadastrada. Se você já tem conta, faça login e use a opção de completar cadastro de aluno.',
          );
        }
        if (constraint.includes('email') || detail.includes('email')) {
          throw new BadRequestException(
            'Este email já está cadastrado. Se você já tem conta, faça login para vincular o cadastro de aluno.',
          );
        }
        if (constraint.includes('cpf') || detail.includes('cpf')) {
          throw new BadRequestException(
            'Este CPF já está cadastrado. Se você já tem conta, faça login com o email associado a esse CPF.',
          );
        }
        throw new BadRequestException(
          'Dados duplicados. Verifique se email, CPF ou matrícula já estão em uso.',
        );
      }
      console.error('[signupAluno]', error);
      throw new InternalServerErrorException('Erro ao cadastrar aluno');
    }
  }

  async updatePassword(userId: string, newPassword: string) {
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

    const user = await this.usuarioRepository.findOne({
      where: {
        email: this.jwtService.verify(dto.token, {
          secret: process.env.JWT_SECRET,
        })['email'],
      },
    });

    if (!user) throw new UnauthorizedException('Token inválido ou expirado');

    user.senha_hash = await bcrypt.hash(dto.newPassword, 12);
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;

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

      // Sincroniza roles com a realidade do banco
      const rolesReais: RolesEnum[] = [];
      if (user.aluno) rolesReais.push(RolesEnum.ALUNO);
      if (user.admin) rolesReais.push(RolesEnum.ADMIN);
      if (
        user.roles.length !== rolesReais.length ||
        !user.roles.every((r) => rolesReais.includes(r))
      ) {
        user.roles = rolesReais;
        await this.usuarioRepository.update(user.usuario_id, { roles: rolesReais });
      }

      return {
        valid: true,
        user: {
          usuario_id: user.usuario_id,
          email: user.email,
          nome: user.nome,
          cpf: user.cpf,
          celular: user.celular,
          data_nascimento: user.data_nascimento,
          roles: user.roles,
          adminAprovado: user.admin?.aprovado ?? null,
          hasAluno: !!user.aluno,
        },
        roles: user.roles,
        payload,
      };
    } catch (e) {
      return { valid: false, error: (e as Error).message };
    }
  }

  async signupAdmin(dto: SignupDtoAdmin) {
    try {
      const existingUsuario = await this.usuarioRepository.findOne({
        where: { email: dto.email },
        select: ['usuario_id', 'email', 'senha_hash', 'nome', 'cpf', 'celular', 'roles', 'data_nascimento'],
        relations: ['aluno', 'admin'],
      });

      if (existingUsuario) {
        if (existingUsuario.admin) {
          throw new BadRequestException(
            'Uma conta só pode ter um cadastro de admin. Você já possui perfil de admin nesta conta.',
          );
        }
        const senhaOk = await bcrypt.compare(dto.senha, existingUsuario.senha_hash);
        if (!senhaOk) {
          throw new BadRequestException(
            'Senha incorreta. Use a senha da sua conta para vincular o cadastro de admin.',
          );
        }
        const admin = this.adminRepository.create({
          usuario: existingUsuario,
          cargo: dto.cargo,
          aprovado: false,
          approvalToken: this.generateRandomToken(),
          approvalTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
        const savedAdmin = await this.adminRepository.save(admin);
        const token = this.jwtService.sign(
          { email: existingUsuario.email },
          { secret: process.env.JWT_SECRET, expiresIn: '2d' },
        );
        await this.adminRepository.update(savedAdmin.id_admin, {
          approvalToken: token,
          approvalTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
        await this.emailService.sendAdminApprovalRequest(
          existingUsuario.email,
          token,
        );
        const rolesAtualizados = existingUsuario.roles?.includes(RolesEnum.ADMIN)
          ? existingUsuario.roles
          : [...(existingUsuario.roles || []), RolesEnum.ADMIN];
        existingUsuario.roles = rolesAtualizados;
        await this.usuarioRepository.save(existingUsuario);
        return {
          sucesso: true,
          mensagem: 'Cadastro de admin vinculado à sua conta, aguardando aprovação.',
          dados: {
            usuario_id: existingUsuario.usuario_id,
            id_admin: savedAdmin.id_admin,
            cargo: savedAdmin.cargo,
            email: existingUsuario.email,
          },
        };
      }

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
        roles: [RolesEnum.ADMIN],
        data_nascimento: new Date(dto.data_nascimento),
      });

      const savedUsuario = await this.usuarioRepository.save(usuario);

      const admin = this.adminRepository.create({
        usuario: savedUsuario,
        cargo: dto.cargo,
        aprovado: false,
        approvalToken: this.generateRandomToken(),
        approvalTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      const savedAdmin = await this.adminRepository.save(admin);

      const token = this.jwtService.sign(
        { email: savedUsuario.email },
        { secret: process.env.JWT_SECRET, expiresIn: '2d' },
      );

      await this.adminRepository.update(savedAdmin.id_admin, {
        approvalToken: token,
        approvalTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      await this.emailService.sendAdminApprovalRequest(
        savedUsuario.email,
        token,
      );

      return {
        sucesso: true,
        mensagem: 'Admin cadastrado, aguardando aprovação',
        dados: {
          usuario_id: savedUsuario.usuario_id,
          id_admin: savedAdmin.id_admin,
          cargo: savedAdmin.cargo,
          email: savedUsuario.email,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Erro ao cadastrar admin:', error);
      throw new BadRequestException(
        'Não foi possível cadastrar o admin. Verifique os dados e tente novamente.',
      );
    }
  }

  async approveAdmin(token: string) {
    const admin = await this.adminRepository.findOne({
      where: { approvalToken: token },
      relations: ['usuario'],
    });

    if (!admin) throw new BadRequestException('Token inválido');
    if (!admin.approvalTokenExpires || admin.approvalTokenExpires < new Date())
      throw new BadRequestException('Token expirado');

    admin.aprovado = true;
    admin.approvalToken = undefined;
    admin.approvalTokenExpires = undefined;

    await this.adminRepository.save(admin);

    const emailNovoAdmin = admin.usuario?.email;
    if (emailNovoAdmin) {
      const base = (process.env.FRONTEND_URL || '').trim().replace(/\/+$/, '') || 'http://localhost:3001';
      const loginUrl = `${base}/login`;
      try {
        await this.emailService.sendAdminApprovedNotification(emailNovoAdmin, loginUrl);
      } catch (err) {
        console.error('[approveAdmin] Falha ao enviar email de aprovação ao novo admin:', err);
      }
    }

    return { sucesso: true, mensagem: 'Admin aprovado com sucesso' };
  }

  async rejectAdmin(token: string) {
    const admin = await this.adminRepository.findOne({
      where: { approvalToken: token },
      relations: ['usuario'],
    });

    if (!admin) throw new BadRequestException('Token inválido');
    if (!admin.approvalTokenExpires || admin.approvalTokenExpires < new Date())
      throw new BadRequestException('Token expirado');

    const usuario = admin.usuario;

    // Remove apenas o registro de Admin, NÃO o usuario inteiro
    // (o usuario pode ter perfil de aluno também)
    await this.adminRepository.remove(admin);

    if (usuario) {
      const rolesAtualizados = (usuario.roles ?? []).filter(
        (r): r is RolesEnum => r !== RolesEnum.ADMIN,
      );
      await this.usuarioRepository.update(usuario.usuario_id, {
        roles: rolesAtualizados as RolesEnum[],
      });

      // Se o usuario não tem mais nenhum perfil (nem aluno nem admin), remove a conta
      const usuarioAtualizado = await this.usuarioRepository.findOne({
        where: { usuario_id: usuario.usuario_id },
        relations: ['aluno'],
      });
      if (usuarioAtualizado && !usuarioAtualizado.aluno && rolesAtualizados.length === 0) {
        await this.usuarioRepository.remove(usuarioAtualizado);
      }
    }

    return { sucesso: true, mensagem: 'Admin rejeitado e removido' };
  }

  private generateRandomToken(length = 32): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < length; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }
}
