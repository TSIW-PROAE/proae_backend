import { AbstractEntity } from 'src/db/abstract.entity';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { Edital } from '../edital/edital.entity';
import { Pergunta } from './pergunta.entity';

@Entity()
export class Step extends AbstractEntity<Step> {
  @ManyToOne(() => Edital, (edital) => edital.steps)
  edital: Edital;

  @Column({ type: 'varchar', length: 255 })
  texto: string;

  @OneToMany(() => Pergunta, (pergunta) => pergunta.step, { cascade: true })
  perguntas: Pergunta[];

  constructor(entity: Partial<Step>) {
    super();
    Object.assign(this, entity);
  }
}
