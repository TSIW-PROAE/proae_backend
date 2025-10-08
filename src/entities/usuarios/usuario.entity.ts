import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from 'typeorm';
import { Aluno } from '../aluno/aluno.entity';
import { Admin } from '../admin/admin.entity';
import { RolesEnum } from '@/src/enum/enumRoles';

@Entity()
export class Usuario {
  @PrimaryGeneratedColumn()
  usuario_id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, select: false })
  senha_hash: string;

  @Column({ type: 'varchar', length: 100 })
  nome: string;

  @Column({ unique: true })
  cpf: string;

  @Column()
  celular: string;

  @Column({ type: 'timestamp', nullable: true })
  lastPasswordResetRequest?: Date;

  @Column({ type: 'varchar', nullable: true })
  passwordResetToken?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  passwordResetTokenExpires?: Date | null;

  @Column({ type: 'date' })
  data_nascimento: Date;

  @Column('simple-array', { default: '' })
  roles: RolesEnum[];

  @OneToOne(() => Aluno, (aluno) => aluno.usuario, { cascade: true })
  aluno?: Aluno;

  @OneToOne(() => Admin, (admin) => admin.usuario, { cascade: true })
  admin?: Admin;
}
