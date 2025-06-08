import { Entity, Column, OneToMany } from 'typeorm';
import { Inscricao } from '../inscricao/inscricao.entity';
import { EtapaInscricao } from '../etapaInscricao/etapaInscricao.entity';
import { AbstractEntity } from 'src/db/abstract.entity';
import { EditalEnum } from 'src/enum/enumEdital';
import { StatusEdital } from 'src/enum/enumStatusEdital';

@Entity()
export class Edital extends AbstractEntity<Edital> {
  @Column({ type: 'enum', enum: EditalEnum })
  tipo_edital: EditalEnum;

  @Column({ type: 'text' })
  descricao: string;

  @Column({ type: 'simple-array' })
  edital_url: string[];

  @Column({ type: 'text' })
  titulo_edital: string;

  @Column()
  quantidade_bolsas: number;

  @Column({
    type: 'enum',
    enum: StatusEdital,
    default: StatusEdital.ABERTO
  })
  status_edital: StatusEdital;

  @OneToMany(() => Inscricao, (inscricao) => inscricao.edital)
  inscricoes: Inscricao[];

  @OneToMany(() => EtapaInscricao, (etapa) => etapa.edital, { cascade: true })
  etapas: EtapaInscricao[];

  constructor(entity: Partial<Edital>) {
    super();
    Object.assign(this, entity);
  }
}
