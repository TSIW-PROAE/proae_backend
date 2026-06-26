import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as cpfLib from 'validation-br/dist/cpf';
import { Brackets, Repository } from 'typeorm';
import { RolesEnum } from 'src/core/shared-kernel/enums/enumRoles';
import {
  AdminPerfilEnum,
  parseAdminPerfil,
  resolveAdminPerfilEfetivo,
} from 'src/core/shared-kernel/enums/adminPerfil.enum';
import { Admin } from 'src/infrastructure/persistence/typeorm/entities/admin/admin.entity';
import { AdminNotificacaoEmail } from 'src/infrastructure/persistence/typeorm/entities/admin/admin-notificacao-email.entity';
import { Usuario } from 'src/infrastructure/persistence/typeorm/entities/usuarios/usuario.entity';
import { AuthService } from '../auth/auth.service';
import { AtualizaAdminDto } from './dto/atualiza-admin.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    @InjectRepository(AdminNotificacaoEmail)
    private readonly notificacaoEmailRepository: Repository<AdminNotificacaoEmail>,
    private readonly authService: AuthService,
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

  private normalizePagination(page?: number, limit?: number) {
    const normalizedPage =
      Number.isFinite(page) && Number(page) > 0 ? Math.floor(Number(page)) : 1;
    const normalizedLimit =
      Number.isFinite(limit) && Number(limit) > 0
        ? Math.min(Math.floor(Number(limit)), 100)
        : 20;
    return {
      page: normalizedPage,
      limit: normalizedLimit,
      skip: (normalizedPage - 1) * normalizedLimit,
    };
  }

  private buildPaginationMeta(totalItems: number, page: number, limit: number) {
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    return {
      pagina: page,
      limite: limit,
      total_itens: totalItems,
      total_paginas: totalPages,
      tem_anterior: page > 1,
      tem_proxima: page < totalPages,
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
  async listAdminsForGerencial(
    requesterUserId: string,
    opts?: {
      page?: number;
      limit?: number;
      busca?: string;
      perfil?: string;
      aprovado?: boolean;
    },
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
        'Apenas perfis gerenciais podem listar a equipe administrativa.',
      );
    }

    const pagination = this.normalizePagination(opts?.page, opts?.limit);
    const busca = opts?.busca?.trim().toLowerCase();
    const perfilFiltro = parseAdminPerfil(opts?.perfil);
    const aprovadoFiltro =
      typeof opts?.aprovado === 'boolean' ? opts.aprovado : undefined;

    const baseQb = this.adminRepository
      .createQueryBuilder('admin')
      .innerJoinAndSelect('admin.usuario', 'usuario');

    if (perfilFiltro) {
      baseQb.andWhere('admin.perfil = :perfilFiltro', { perfilFiltro });
    }

    if (busca) {
      baseQb.andWhere(
        new Brackets((subQb) => {
          subQb
            .where('LOWER(usuario.nome) LIKE :busca', { busca: `%${busca}%` })
            .orWhere('LOWER(usuario.email) LIKE :busca', {
              busca: `%${busca}%`,
            })
            .orWhere('LOWER(admin.cargo) LIKE :busca', { busca: `%${busca}%` });
        }),
      );
    }

    const resumoRaw = await baseQb
      .clone()
      .select('admin.aprovado', 'aprovado')
      .addSelect('COUNT(admin.id_admin)', 'total')
      .groupBy('admin.aprovado')
      .getRawMany<{ aprovado: boolean | null; total: string }>();

    const filtrosQb = baseQb.clone();
    if (aprovadoFiltro !== undefined) {
      filtrosQb.andWhere('admin.aprovado = :aprovadoFiltro', {
        aprovadoFiltro,
      });
    }

    const total = await filtrosQb.clone().getCount();
    const admins = await filtrosQb
      .clone()
      .orderBy('admin.id_admin', 'ASC')
      .skip(pagination.skip)
      .take(pagination.limit)
      .getMany();

    const isAprovado = (value: unknown): boolean =>
      value === true || value === 'true' || value === 't' || value === 1 || value === '1';

    const resumo = {
      total_geral: resumoRaw.reduce(
        (acc, item) => acc + Number(item.total ?? 0),
        0,
      ),
      total_aprovados: resumoRaw
        .filter((item) => isAprovado(item.aprovado))
        .reduce((acc, item) => acc + Number(item.total ?? 0), 0),
      total_pendentes: resumoRaw
        .filter((item) => !isAprovado(item.aprovado))
        .reduce((acc, item) => acc + Number(item.total ?? 0), 0),
    };

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
      paginacao: this.buildPaginationMeta(
        total,
        pagination.page,
        pagination.limit,
      ),
      resumo,
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

  async approveAdminByGerencial(
    requesterUserId: string,
    targetAdminId: number,
    perfilOverride?: string | null,
  ) {
    await this.assertGerencial(requesterUserId);
    return this.authService.approveAdminById(targetAdminId, perfilOverride);
  }

  async rejectAdminByGerencial(requesterUserId: string, targetAdminId: number) {
    await this.assertGerencial(requesterUserId);
    return this.authService.rejectAdminById(targetAdminId);
  }

  async removeAdminPerfilByGerencial(
    requesterUserId: string,
    targetAdminId: number,
  ) {
    await this.assertGerencial(requesterUserId);

    const target = await this.adminRepository.findOne({
      where: { id_admin: targetAdminId },
      relations: ['usuario'],
    });
    if (!target) {
      throw new NotFoundException('Admin não encontrado.');
    }
    if (target.usuario?.usuario_id === requesterUserId) {
      throw new BadRequestException(
        'Não é permitido excluir o próprio perfil administrativo.',
      );
    }

    const perfilAlvo = resolveAdminPerfilEfetivo(target.perfil);
    if (perfilAlvo === AdminPerfilEnum.GERENCIAL) {
      throw new ForbiddenException(
        'Não é permitido excluir perfil gerencial por esta rota. Restrito a perfis técnico e coordenação.',
      );
    }

    const usuario = target.usuario;
    await this.adminRepository.remove(target);

    if (usuario) {
      const rolesAtualizados = (usuario.roles ?? []).filter(
        (r): r is RolesEnum => r !== RolesEnum.ADMIN,
      );
      await this.usuarioRepository.update(usuario.usuario_id, {
        roles: rolesAtualizados as RolesEnum[],
      });

      const usuarioAtualizado = await this.usuarioRepository.findOne({
        where: { usuario_id: usuario.usuario_id },
        relations: ['admin', 'aluno'],
      });
      if (
        usuarioAtualizado &&
        !usuarioAtualizado.admin &&
        !usuarioAtualizado.aluno &&
        rolesAtualizados.length === 0
      ) {
        await this.usuarioRepository.remove(usuarioAtualizado);
      }
    }

    return {
      sucesso: true,
      mensagem: 'Perfil administrativo removido com sucesso.',
      dados: {
        admin_id: targetAdminId,
        perfil_removido: perfilAlvo,
      },
    };
  }

  async listNotificacaoEmails(requesterUserId: string) {
    await this.assertGerencial(requesterUserId);
    const rows = await this.notificacaoEmailRepository.find({
      order: { id: 'ASC' },
    });
    const envEmails =
      process.env.ADMINS_EMAILS?.split(',')
        .map((e) => e.trim())
        .filter(Boolean) ?? [];
    return {
      sucesso: true,
      dados: {
        emails: rows.map((r) => ({
          id: r.id,
          email: r.email,
          criado_em: r.criadoEm,
        })),
        usa_banco: rows.length > 0,
        emails_ambiente: rows.length === 0 ? envEmails : [],
      },
    };
  }

  async addNotificacaoEmail(requesterUserId: string, email: string) {
    await this.assertGerencial(requesterUserId);
    const normalizado = email.trim().toLowerCase();
    const existente = await this.notificacaoEmailRepository.findOne({
      where: { email: normalizado },
    });
    if (existente) {
      throw new BadRequestException('Este e-mail já está na lista de notificações.');
    }
    const salvo = await this.notificacaoEmailRepository.save(
      this.notificacaoEmailRepository.create({ email: normalizado }),
    );
    return {
      sucesso: true,
      mensagem: 'E-mail adicionado à lista de notificações.',
      dados: {
        id: salvo.id,
        email: salvo.email,
        criado_em: salvo.criadoEm,
      },
    };
  }

  async removeNotificacaoEmail(requesterUserId: string, emailId: number) {
    await this.assertGerencial(requesterUserId);
    const row = await this.notificacaoEmailRepository.findOne({
      where: { id: emailId },
    });
    if (!row) {
      throw new NotFoundException('E-mail de notificação não encontrado.');
    }
    await this.notificacaoEmailRepository.remove(row);
    return {
      sucesso: true,
      mensagem: 'E-mail removido da lista de notificações.',
    };
  }

  private async assertGerencial(requesterUserId: string) {
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
        'Apenas perfis gerenciais podem executar esta ação.',
      );
    }
  }
}
