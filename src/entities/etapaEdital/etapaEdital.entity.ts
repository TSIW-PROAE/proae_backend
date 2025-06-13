import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { Edital } from '../edital/edital.entity';
import { AbstractEntity } from 'src/db/abstract.entity';

@Entity()
export class EtapaEdital extends AbstractEntity<EtapaEdital> {
  @ManyToOne(() => Edital, (edital) => edital.etapas)
  edital: Edital;

  @Column()
  nome: string;

  @Column()
  ordem: number;

  @Column({ type: 'date' })
  data_inicio: Date;

  @Column({ type: 'date' })
  data_fim: Date;

  constructor(entity: Partial<EtapaEdital>) {
    super();
    Object.assign(this, entity);
  }
}
