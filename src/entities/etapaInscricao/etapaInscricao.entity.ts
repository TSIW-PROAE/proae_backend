import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { Edital } from '../edital/edital.entity';
import { ResultadoEtapa } from '../resultadoEtapa/resultadoEtapa.entity';
import { AbstractEntity } from 'src/db/abstract.entity';

@Entity()
export class EtapaInscricao extends AbstractEntity<EtapaInscricao> {
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

  @OneToMany(() => ResultadoEtapa, (resultado) => resultado.etapa, {
    nullable: true,
  })
  resultados: ResultadoEtapa[];

  constructor(entity: Partial<EtapaInscricao>) {
    super();
    Object.assign(this, entity);
  }
}
