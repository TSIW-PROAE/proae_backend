import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as cpfLib from 'validation-br/dist/cpf';
import { Repository } from 'typeorm';
import { RolesEnum } from 'src/core/shared-kernel/enums/enumRoles';
import { Admin } from 'src/infrastructure/persistence/typeorm/entities/admin/admin.entity';
import { Usuario } from 'src/infrastructure/persistence/typeorm/entities/usuarios/usuario.entity';
import { AtualizaAdminDto } from './dto/atualiza-admin.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
  ) {}

  private ensureAdminRole(usuario: Usuario) {
    if (!usuario.roles?.includes(RolesEnum.ADMIN)) {
      throw new ForbiddenException(
        'Apenas usuários com perfil de servidor PROAE podem acessar este recurso.',
      );
    }
  }

  private formatDataNascimento(d: Date): string {
    const iso = d instanceof Date ? d.toISOString() : new Date(d).toISOString();
    return iso.slice(0, 10);
  }

  private toAdminPayload(usuario: Usuario, admin: Admin | null) {
    return {
      id_admin: admin?.id_admin ?? null,
      nome: usuario.nome,
      email: usuario.email,
      cargo: admin?.cargo ?? '',
      data_nascimento: this.formatDataNascimento(usuario.data_nascimento),
      cpf: usuario.cpf,
      celular: usuario.celular,
      aprovado: admin?.aprovado ?? null,
    };
  }

  async getMe(userId: string) {
    const usuario = await this.usuarioRepository.findOne({
      where: { usuario_id: userId },
      relations: ['admin'],
    });
    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }
    this.ensureAdminRole(usuario);

    return {
      sucesso: true,
      dados: {
        admin: this.toAdminPayload(usuario, usuario.admin ?? null),
      },
    };
  }

  async updateProfile(userId: string, dto: AtualizaAdminDto) {
    const usuario = await this.usuarioRepository.findOne({
      where: { usuario_id: userId },
      relations: ['admin'],
    });
    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }
    this.ensureAdminRole(usuario);

    const hasAny =
      dto.nome !== undefined ||
      dto.email !== undefined ||
      dto.cargo !== undefined ||
      dto.data_nascimento !== undefined ||
      dto.cpf !== undefined ||
      dto.celular !== undefined;
    if (!hasAny) {
      throw new BadRequestException('Dados para atualização não fornecidos.');
    }

    if (dto.email !== undefined && dto.email !== usuario.email) {
      const outro = await this.usuarioRepository.findOne({
        where: { email: dto.email },
      });
      if (outro && outro.usuario_id !== usuario.usuario_id) {
        throw new BadRequestException('Email já está em uso.');
      }
      usuario.email = dto.email;
    }

    if (dto.nome !== undefined) usuario.nome = dto.nome;
    if (dto.celular !== undefined) usuario.celular = dto.celular;

    if (dto.data_nascimento !== undefined) {
      usuario.data_nascimento = new Date(dto.data_nascimento);
    }

    if (dto.cpf !== undefined && dto.cpf.trim() !== '') {
      const digits = dto.cpf.replace(/\D/g, '');
      const masked = cpfLib.mask(digits);
      if (masked !== usuario.cpf) {
        const outroCpf = await this.usuarioRepository.findOne({
          where: { cpf: masked },
        });
        if (outroCpf && outroCpf.usuario_id !== usuario.usuario_id) {
          throw new BadRequestException('CPF já cadastrado.');
        }
        usuario.cpf = masked;
      }
    }

    if (dto.cargo !== undefined) {
      if (!usuario.admin) {
        const novo = this.adminRepository.create({
          usuario,
          cargo: dto.cargo,
          aprovado: true,
        });
        usuario.admin = novo;
      } else {
        usuario.admin.cargo = dto.cargo;
      }
    }

    await this.usuarioRepository.save(usuario);

    const atualizado = await this.usuarioRepository.findOne({
      where: { usuario_id: userId },
      relations: ['admin'],
    });

    return {
      success: true,
      message: 'Dados atualizados com sucesso!',
      dados: {
        admin: this.toAdminPayload(
          atualizado!,
          atualizado!.admin ?? null,
        ),
      },
    };
  }
}
