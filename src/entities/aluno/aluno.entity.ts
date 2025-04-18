import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Inscricao } from '../inscricao/inscricao.entity';
import { PronomesEnum } from 'src/enum/enumPronomes';
import { CursosEnum } from 'src/enum/enumCursos';
import { UnidadeEnum } from 'src/enum/enumCampus';

@Entity()
export class Aluno {
  @PrimaryGeneratedColumn()
  aluno_id: number;

  @Column()
  id_clerk: string;

  @Column({ type: 'enum', enum: PronomesEnum })
  pronome: PronomesEnum;

  @Column({ type: 'date' })
  data_nascimento: Date;

  @Column({ type: 'enum', enum: CursosEnum })
  curso: CursosEnum;

  @Column({ type: 'enum', enum: UnidadeEnum })
  campus: UnidadeEnum;

  @Column()
  cpf: string;

  @Column({ type: 'date' })
  data_ingresso: Date;

  @Column()
  identidade: string;

  @Column()
  celular: string;

  @OneToMany(() => Inscricao, (inscricao) => inscricao.edital)
  inscricoes: Inscricao[];
}
