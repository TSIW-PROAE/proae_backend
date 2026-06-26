import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';
import { AdminPerfilEnum } from 'src/core/shared-kernel/enums/adminPerfil.enum';

@Entity()
export class Admin {
  @PrimaryGeneratedColumn()
  id_admin: number;

  @Column({ length: 100 })
  cargo: string;

  /**
   * Perfil de acesso do admin: tecnico | gerencial | coordenacao.
   * Default no banco = `gerencial` para preservar o comportamento histórico
   * (cadastros antigos ficam com permissões completas até serem revisados).
   */
  @Column({
    type: 'varchar',
    length: 20,
    default: AdminPerfilEnum.GERENCIAL,
  })
  perfil: AdminPerfilEnum;

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
