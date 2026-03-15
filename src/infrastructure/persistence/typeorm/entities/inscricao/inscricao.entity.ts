import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../abstract.entity';
import { StatusInscricao } from 'src/core/shared-kernel/enums/enumStatusInscricao';
import { Aluno } from '../aluno/aluno.entity';
import { Documento } from '../documento/documento.entity';
import { Vagas } from '../vagas/vagas.entity';
import { Resposta } from '../resposta/resposta.entity';

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

  @Column({ type: 'text', nullable: true })
  observacao_admin?: string;

  @ManyToOne(() => Aluno, (aluno) => aluno.inscricoes)
  aluno: Aluno;

  constructor(entity: Partial<Inscricao>) {
    super();
    Object.assign(this, entity);
  }
}
