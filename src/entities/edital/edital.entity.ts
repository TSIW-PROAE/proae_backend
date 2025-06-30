import { AbstractEntity } from 'src/db/abstract.entity';
import { EditalEnum } from 'src/enum/enumEdital';
import { StatusEdital } from 'src/enum/enumStatusEdital';
import { EnumTipoDocumento } from 'src/enum/enumTipoDocumento';
import { Column, Entity, OneToMany } from 'typeorm';
import { EtapaEdital } from '../etapaEdital/etapaEdital.entity';
import { Inscricao } from '../inscricao/inscricao.entity';
import { Step } from './step.entity';

@Entity()
export class Edital extends AbstractEntity<Edital> {
  @Column({ type: 'enum', enum: EditalEnum })
  tipo_edital: EditalEnum;

  @Column({ type: 'text' })
  descricao: string;

  @Column({ type: 'text' })
  edital_url: string;

  @Column({ type: 'text' })
  titulo_edital: string;

  @Column()
  quantidade_bolsas: number;

  @Column({
    type: 'enum',
    enum: StatusEdital,
    default: StatusEdital.ABERTO,
  })
  status_edital: StatusEdital;

  @OneToMany(() => Inscricao, (inscricao) => inscricao.edital)
  inscricoes: Inscricao[];

  @OneToMany(() => EtapaEdital, (etapa) => etapa.edital, { cascade: true })
  etapas: EtapaEdital[];

  @OneToMany(() => Step, (step) => step.edital)
  steps: Step[];

  @Column({ type: 'simple-array', nullable: true })
  tipo_documentos: EnumTipoDocumento[];

  constructor(entity: Partial<Edital>) {
    super();
    Object.assign(this, entity);
  }
}
