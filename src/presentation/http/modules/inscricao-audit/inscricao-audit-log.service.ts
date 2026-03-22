import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InscricaoStatusAuditLog } from 'src/infrastructure/persistence/typeorm/entities/inscricao/inscricao-status-audit-log.entity';

export interface LogInscricaoStatusParams {
  inscricaoId: number;
  actorUsuarioId: string | null;
  statusAnterior: string | null;
  statusNovo: string;
  observacao?: string | null;
}

@Injectable()
export class InscricaoAuditLogService {
  constructor(
    @InjectRepository(InscricaoStatusAuditLog)
    private readonly repo: Repository<InscricaoStatusAuditLog>,
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

  /** Últimas alterações de status (admin / FG / renovação / hub). */
  async findByInscricaoId(
    inscricaoId: number,
    take = 50,
  ): Promise<InscricaoStatusAuditLog[]> {
    return this.repo.find({
      where: { inscricao_id: inscricaoId },
      order: { created_at: 'DESC' },
      take,
    });
  }
}
