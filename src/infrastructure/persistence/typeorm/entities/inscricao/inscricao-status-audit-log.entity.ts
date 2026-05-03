import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Auditoria de alterações de status de inscrição (admin / FG / renovação / hub).
 */
@Entity('inscricao_status_audit_log')
export class InscricaoStatusAuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  inscricao_id: number;

  @Column({ type: 'varchar', length: 128, nullable: true })
  actor_usuario_id: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  status_anterior: string | null;

  @Column({ type: 'varchar', length: 120 })
  status_novo: string;

  @Column({ type: 'text', nullable: true })
  observacao: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
