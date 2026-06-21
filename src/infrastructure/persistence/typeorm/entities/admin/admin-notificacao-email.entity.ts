import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

/** Destinatários que recebem e-mail de pedido de aprovação de novo admin. */
@Entity('admin_notificacao_email')
export class AdminNotificacaoEmail {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255, unique: true })
  email: string;

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;
}
