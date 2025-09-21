import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UnidadeEnum } from '../../enum/enumCampus';
import { Inscricao } from '../inscricao/inscricao.entity';
import { ValorDado } from '../valorDado/valorDado.entity';
import { Usuario } from '../usuarios/role.entity';

@Entity()
export class Aluno {
  @PrimaryGeneratedColumn()
  aluno_id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  matricula: string;

  @Column({ type: 'varchar', length: 255, select: false })
  senha_hash: string;

  @Column({ type: 'varchar', length: 100 })
  nome: string;

  @Column({ type: 'date' })
  data_nascimento: Date;

  @Column({ type: 'varchar', length: 100 })
  curso: string;

  @Column({ type: 'enum', enum: UnidadeEnum })
  campus: UnidadeEnum;

  @Column({ unique: true })
  cpf: string;

  @Column()
  data_ingresso: string;

  @Column()
  celular: string;

  @Column({ type: 'timestamp', nullable: true })
  lastPasswordResetRequest: Date;

  @Column({ type: 'varchar', nullable: true })
  passwordResetToken: string | null;

  @Column({ type: 'timestamp', nullable: true })
  passwordResetTokenExpires: Date | null;

  @OneToMany(() => Inscricao, (inscricao) => inscricao.aluno)
  inscricoes: Inscricao[];

  @OneToMany(() => ValorDado, (valor) => valor.aluno)
  valoresDado: ValorDado[];

  @ManyToOne(() => Usuario, { eager: true })
  role: Usuario;
}
