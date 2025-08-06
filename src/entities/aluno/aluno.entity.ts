import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { UnidadeEnum } from '../../enum/enumCampus';
import { CursosEnum } from '../../enum/enumCursos';
import { PronomesEnum } from '../../enum/enumPronomes';
import { Inscricao } from '../inscricao/inscricao.entity';

@Entity()
export class Aluno {
  @PrimaryGeneratedColumn()
  aluno_id: number;

  @Column()
  matricula: string;

  @Column()
  email: string;

  @Column()
  senha: string;

  @Column()
  nome: string;

  @Column()
  sobrenome: string;

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
