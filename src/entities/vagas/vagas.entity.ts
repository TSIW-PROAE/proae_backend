import { AbstractEntity } from 'src/db/abstract.entity';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { Edital } from '../edital/edital.entity';
import { Inscricao } from '../inscricao/inscricao.entity';

@Entity()
export class Vagas extends AbstractEntity<Vagas> {
  @Column({ type: 'text' })
  beneficio: string;

  @Column({ type: 'text' })
  descricao_beneficio: string;

  @Column()
  numero_vagas: number;

  @ManyToOne(() => Edital, (edital) => edital.vagas)
  edital: Edital;

  @OneToMany(() => Inscricao, (inscricao) => inscricao.vagas, { cascade: true })
  inscricoes: Inscricao[];

  constructor(entity: Partial<Vagas>) {
    super();
    Object.assign(this, entity);
  }
}
