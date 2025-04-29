import { Entity, Column, OneToMany } from 'typeorm';
import { Inscricao } from '../inscricao/inscricao.entity';
import { EtapaInscricao } from '../etapaInscricao/etapaInscricao.entity';
import { AbstractEntity } from 'src/db/abstract.entity';

@Entity()
export class Edital extends AbstractEntity<Edital> {
  @Column({ type: 'text' })
  nome_edital: string;

  @Column({ type: 'text' })
  descricao: string;

  @Column({ type: 'simple-array' })
  tipo_beneficio: string[];

  @Column({ type: 'simple-array' })
  edital_url: string[];

  @Column({ type: 'simple-array', nullable: true })
  categoria_edital: string[];

  @Column({ type: 'text' })
  status_edital: string;

  @Column()
  quantidade_bolsas: number;

  @OneToMany(() => Inscricao, (inscricao) => inscricao.edital)
  inscricoes: Inscricao[];

  @OneToMany(() => EtapaInscricao, (etapa) => etapa.edital, { cascade: true })
  etapas: EtapaInscricao[];

  constructor(entity: Partial<Edital>) {
    super();
    Object.assign(this, entity);
  }
}
