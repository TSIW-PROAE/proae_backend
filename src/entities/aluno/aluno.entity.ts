import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { UnidadeEnum } from '../../enum/enumCampus';
import { CursosEnum } from '../../enum/enumCursos';
import { PronomesEnum } from '../../enum/enumPronomes';
import { Inscricao } from '../inscricao/inscricao.entity';

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

  @Column({ type: 'enum', enum: PronomesEnum })
  pronome: PronomesEnum;

  @Column({ type: 'date' })
  data_nascimento: Date;

  @Column({ type: 'enum', enum: CursosEnum })
  curso: CursosEnum;

  @Column({ type: 'enum', enum: UnidadeEnum })
  campus: UnidadeEnum;

  @Column({ unique: true })
  cpf: string;

  @Column()
  data_ingresso: string;

  @Column()
  celular: string;

  @OneToMany(() => Inscricao, (inscricao) => inscricao.aluno)
  inscricoes: Inscricao[];
}
