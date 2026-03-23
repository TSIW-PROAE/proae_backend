import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { InscricaoStatusAuditLog } from 'src/infrastructure/persistence/typeorm/entities/inscricao/inscricao-status-audit-log.entity';
import { Usuario } from 'src/infrastructure/persistence/typeorm/entities/usuarios/usuario.entity';

export interface LogInscricaoStatusParams {
  inscricaoId: number;
  actorUsuarioId: string | null;
  statusAnterior: string | null;
  statusNovo: string;
  observacao?: string | null;
}

export type InscricaoStatusAuditLogComNome = InscricaoStatusAuditLog & {
  actor_nome: string | null;
};

@Injectable()
export class InscricaoAuditLogService {
  constructor(
    @InjectRepository(InscricaoStatusAuditLog)
    private readonly repo: Repository<InscricaoStatusAuditLog>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
  ) {}

  async logStatusChange(params: LogInscricaoStatusParams): Promise<void> {
    const row = this.repo.create({
      inscricao_id: params.inscricaoId,
      actor_usuario_id: params.actorUsuarioId,
      status_anterior: params.statusAnterior,
      status_novo: params.statusNovo,
      observacao: params.observacao ?? null,
    });
    await this.repo.save(row);
  }

  /** Últimas alterações de status (admin / FG / renovação / hub). Inclui nome do usuário ator quando existir. */
  async findByInscricaoId(
    inscricaoId: number,
    take = 50,
  ): Promise<InscricaoStatusAuditLogComNome[]> {
    const logs = await this.repo.find({
      where: { inscricao_id: inscricaoId },
      order: { created_at: 'DESC' },
      take,
    });
    const ids = [
      ...new Set(
        logs
          .map((l) => l.actor_usuario_id?.trim())
          .filter((x): x is string => !!x),
      ),
    ];
    if (ids.length === 0) {
      return logs.map((l) => ({ ...l, actor_nome: null }));
    }
    const usuarios = await this.usuarioRepo.find({
      where: { usuario_id: In(ids) },
      select: ['usuario_id', 'nome'],
    });
    const nomePorId = new Map(
      usuarios.map((u) => [u.usuario_id, u.nome?.trim() || null] as const),
    );
    return logs.map((l) => {
      const aid = l.actor_usuario_id?.trim();
      const actor_nome = aid ? nomePorId.get(aid) ?? null : null;
      return { ...l, actor_nome };
    });
  }
}
