import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UnidadeEnum } from '../../enum/enumCampus';
import { Inscricao } from '../inscricao/inscricao.entity';
import { ValorDado } from '../valorDado/valorDado.entity';
import { Usuario } from '../usuarios/usuario.entity';

@Entity()
export class Aluno {
  @PrimaryGeneratedColumn()
  aluno_id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  matricula: string;

  @Column({ type: 'varchar', length: 100 })
  curso: string;

  @Column({ type: 'enum', enum: UnidadeEnum })
  campus: UnidadeEnum;

  @Column()
  data_ingresso: string;

  @OneToMany(() => Inscricao, (inscricao) => inscricao.aluno)
  inscricoes: Inscricao[];

  @OneToMany(() => ValorDado, (valor) => valor.aluno)
  valoresDado: ValorDado[];

  @OneToOne(() => Usuario, (usuario: Usuario) => usuario.aluno, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn()
  usuario!: Usuario;
}
