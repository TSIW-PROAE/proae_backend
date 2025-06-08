import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { Aluno } from '../aluno/aluno.entity';
import { Edital } from '../edital/edital.entity';
import { ResultadoEtapa } from '../resultadoEtapa/resultadoEtapa.entity';
import { Documento } from '../documento/documento.entity';
import { StatusInscricao } from '../../enum/enumStatusInscricao';
import { Resposta } from './resposta.entity';
import { AbstractEntity } from 'src/db/abstract.entity';

@Entity()
export class Inscricao extends AbstractEntity<Inscricao> {
  @ManyToOne(() => Aluno, (aluno) => aluno.inscricoes)
  aluno: Aluno;

  @ManyToOne(() => Edital, (edital) => edital.inscricoes)
  edital: Edital;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  data_inscricao: Date;

  @Column({ type: 'enum', enum: StatusInscricao, default: StatusInscricao.PENDENTE })
  status_inscricao: StatusInscricao;

  @OneToMany(() => Documento, (documento) => documento.inscricao, {
    nullable: true,
  })
  documentos: Documento[];

  @OneToMany(() => Resposta, (resposta) => resposta.inscricao, {
    nullable: true,
    cascade: true
  })
  respostas: Resposta[];

  constructor(entity: Partial<Inscricao>) {
    super();
    Object.assign(this, entity);
  }
}
