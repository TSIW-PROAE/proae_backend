import { Column, Entity, ManyToOne, OneToMany, OneToOne } from 'typeorm';
import { AbstractEntity } from '../../db/abstract.entity';
import { StatusInscricao } from '../../enum/enumStatusInscricao';
import { Aluno } from '../aluno/aluno.entity';
import { Beneficio } from '../beneficio/beneficio.entity';
import { Documento } from '../documento/documento.entity';
import { Vagas } from '../vagas/vagas.entity';
import { Resposta } from './resposta.entity';

@Entity()
export class Inscricao extends AbstractEntity<Inscricao> {
  @ManyToOne(() => Vagas, (vagas) => vagas.inscricoes)
  vagas: Vagas;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  data_inscricao: Date;

  @Column({
    type: 'enum',
    enum: StatusInscricao,
    default: StatusInscricao.PENDENTE,
  })
  status_inscricao: StatusInscricao;

  @OneToMany(() => Documento, (documento) => documento.inscricao, {
    nullable: true,
    cascade: true,
  })
  documentos: Documento[];

  @OneToMany(() => Resposta, (resposta) => resposta.inscricao, {
    nullable: true,
    cascade: true,
  })
  respostas: Resposta[];

  @ManyToOne(() => Aluno, (aluno) => aluno.inscricoes)
  aluno: Aluno;

  @OneToOne(() => Beneficio, (beneficio) => beneficio.inscricao, {
    cascade: true,
  })
  beneficio: Beneficio;

  constructor(entity: Partial<Inscricao>) {
    super();
    Object.assign(this, entity);
  }
}
