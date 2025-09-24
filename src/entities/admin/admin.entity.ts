import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';

@Entity()
export class Admin {
  @PrimaryColumn()
  id_admin: number;

  @Column({ length: 100 })
  cargo: string;

  @Column({ default: false })
  aprovado: boolean;

  @Column({ nullable: true })
  approvalToken?: string;

  @Column({ nullable: true })
  approvalTokenExpires?: Date;

  @OneToOne(() => Usuario, (usuario: Usuario) => usuario.admin, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn()
  usuario!: Usuario;
}
