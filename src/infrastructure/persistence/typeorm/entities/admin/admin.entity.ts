import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';

@Entity()
export class Admin {
  @PrimaryGeneratedColumn()
  id_admin: number;

  @Column({ length: 100 })
  cargo: string;

  @Column({ default: false })
  aprovado: boolean;

  @Column({ nullable: true })
  approvalToken?: string;

  @Column({ nullable: true })
  approvalTokenExpires?: Date;

  /** Uma conta (Usuario) pode ter no máximo um Admin. UNIQUE garantido pela migration. */
  @OneToOne(() => Usuario, (usuario: Usuario) => usuario.admin, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  usuario!: Usuario;
}
