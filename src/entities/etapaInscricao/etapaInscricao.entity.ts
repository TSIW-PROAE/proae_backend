import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Edital } from '../edital/edital.entity';
import { ResultadoEtapa } from '../resultadoEtapa/resultadoEtapa.entity';
import { AbstractEntity } from 'src/db/abstract.entity';
import { IsString } from 'class-validator';

@Entity()
export class EtapaInscricao extends AbstractEntity<EtapaInscricao> {

  @ManyToOne(() => Edital, (edital) => edital.etapas)
  edital: Edital;

  @Column()
  nome: string;

  @Column()
  ordem: number;

  @Column({ type: 'text' })
  descricao: string;

  @OneToMany(() => ResultadoEtapa, (resultado) => resultado.etapa)
  resultados: ResultadoEtapa[];

  constructor(entity: Partial<EtapaInscricao>) {
    super();
    Object.assign(this, entity);
  }
}
