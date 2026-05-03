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
import {
  AdminPerfilEnum,
  parseAdminPerfil,
  resolveAdminPerfilEfetivo,
} from 'src/core/shared-kernel/enums/adminPerfil.enum';
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
      perfil: admin ? resolveAdminPerfilEfetivo(admin.perfil) : null,
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
      dto.perfil !== undefined ||
      dto.data_nascimento !== undefined ||
      dto.cpf !== undefined ||
      dto.celular !== undefined;
    if (!hasAny) {
      throw new BadRequestException('Dados para atualização não fornecidos.');
    }

    if (dto.perfil !== undefined) {
      const perfilParsed = parseAdminPerfil(dto.perfil);
      if (!perfilParsed) {
        throw new BadRequestException(
          'Perfil inválido. Use tecnico, gerencial ou coordenacao.',
        );
      }
      // Apenas gerencial pode trocar o próprio perfil; demais perfis ignoram a tentativa.
      const perfilAtual = resolveAdminPerfilEfetivo(usuario.admin?.perfil);
      if (perfilAtual !== AdminPerfilEnum.GERENCIAL) {
        throw new ForbiddenException(
          'Apenas perfis gerenciais podem alterar o perfil de acesso.',
        );
      }
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
          perfil: AdminPerfilEnum.GERENCIAL,
          aprovado: true,
        });
        usuario.admin = novo;
      } else {
        usuario.admin.cargo = dto.cargo;
      }
    }

    if (dto.perfil !== undefined && usuario.admin) {
      usuario.admin.perfil = parseAdminPerfil(dto.perfil)!;
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

  /**
   * Lista todos os admins cadastrados (aprovados ou pendentes), incluindo
   * o perfil de acesso. Uso típico: tela de gerenciamento da equipe PROAE.
   *
   * Apenas perfis `gerencial` devem chamar este método; o controller já aplica
   * `AdminPerfisGuard`. Aqui, por defesa em profundidade, validamos o perfil
   * do solicitante novamente.
   */
  async listAdminsForGerencial(requesterUserId: string) {
    const requester = await this.usuarioRepository.findOne({
      where: { usuario_id: requesterUserId },
      relations: ['admin'],
    });
    if (!requester) {
      throw new NotFoundException('Usuário solicitante não encontrado.');
    }
    this.ensureAdminRole(requester);
    const perfilSolicitante = resolveAdminPerfilEfetivo(
      requester.admin?.perfil,
    );
    if (perfilSolicitante !== AdminPerfilEnum.GERENCIAL) {
      throw new ForbiddenException(
        'Apenas perfis gerenciais podem listar a equipe administrativa.',
      );
    }

    const admins = await this.adminRepository.find({
      relations: ['usuario'],
      order: { id_admin: 'ASC' },
    });

    return {
      sucesso: true,
      dados: admins.map((a) => ({
        id_admin: a.id_admin,
        usuario_id: a.usuario?.usuario_id ?? null,
        nome: a.usuario?.nome ?? '',
        email: a.usuario?.email ?? '',
        cargo: a.cargo ?? '',
        perfil: resolveAdminPerfilEfetivo(a.perfil),
        aprovado: a.aprovado === true,
        sou_eu: a.usuario?.usuario_id === requesterUserId,
      })),
    };
  }

  /**
   * Altera o perfil de acesso de OUTRO admin. Apenas gerenciais podem chamar
   * (controller já protege via guard); aqui rejeitamos a auto-alteração para
   * evitar que o último gerencial se rebaixe sozinho — ele deve usar a tela de
   * configuração pessoal apenas para alterar dados próprios e, se quiser mudar
   * o próprio perfil, deve pedir a outro gerencial.
   */
  async updateAdminPerfilByGerencial(
    requesterUserId: string,
    targetAdminId: number,
    novoPerfil: AdminPerfilEnum,
  ) {
    const requester = await this.usuarioRepository.findOne({
      where: { usuario_id: requesterUserId },
      relations: ['admin'],
    });
    if (!requester) {
      throw new NotFoundException('Usuário solicitante não encontrado.');
    }
    this.ensureAdminRole(requester);
    const perfilSolicitante = resolveAdminPerfilEfetivo(
      requester.admin?.perfil,
    );
    if (perfilSolicitante !== AdminPerfilEnum.GERENCIAL) {
      throw new ForbiddenException(
        'Apenas perfis gerenciais podem alterar perfis da equipe.',
      );
    }

    const target = await this.adminRepository.findOne({
      where: { id_admin: targetAdminId },
      relations: ['usuario'],
    });
    if (!target) {
      throw new NotFoundException('Admin não encontrado.');
    }

    if (target.usuario?.usuario_id === requesterUserId) {
      throw new BadRequestException(
        'Para alterar seu próprio perfil, peça a outro gerencial. Isto evita rebaixamentos acidentais do último gerencial.',
      );
    }

    target.perfil = novoPerfil;
    await this.adminRepository.save(target);

    return {
      sucesso: true,
      mensagem: 'Perfil atualizado com sucesso.',
      dados: {
        id_admin: target.id_admin,
        usuario_id: target.usuario?.usuario_id ?? null,
        nome: target.usuario?.nome ?? '',
        email: target.usuario?.email ?? '',
        cargo: target.cargo ?? '',
        perfil: resolveAdminPerfilEfetivo(target.perfil),
        aprovado: target.aprovado === true,
      },
    };
  }
}
