import { Entity, Column, OneToMany } from 'typeorm';
import { Inscricao } from '../inscricao/inscricao.entity';
import { EtapaInscricao } from '../etapaInscricao/etapaInscricao.entity';
import { EditalEnum } from '../../enum/enumEdital';
import { StatusEdital } from '../../enum/enumStatusEdital';
import { AbstractEntity } from 'src/db/abstract.entity';

@Entity()
export class Edital extends AbstractEntity<Edital> {
  @Column({ type: 'enum', enum: EditalEnum })
  tipo_beneficio: EditalEnum;

  @Column({ type: 'text' })
  descricao: string;

  @Column()
  edital_url: string;

  @Column({ type: 'date' })
  data_inicio: Date;

  @Column({ type: 'date' })
  data_fim: Date;

  @Column({ type: 'enum', enum: StatusEdital, default: StatusEdital.ATIVO })
  status_edital: StatusEdital;

  @OneToMany(() => Inscricao, (inscricao) => inscricao.edital)
  inscricoes: Inscricao[];

  @OneToMany(() => EtapaInscricao, (etapa) => etapa.edital, { cascade: true})
  etapas: EtapaInscricao[];

  constructor(entity: Partial<Edital>) {
    super();
    Object.assign(this, entity);
  }
}
