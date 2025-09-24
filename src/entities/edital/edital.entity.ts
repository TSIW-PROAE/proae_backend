import { AbstractEntity } from 'src/db/abstract.entity';
import { StatusEdital } from 'src/enum/enumStatusEdital';
import { Column, Entity, OneToMany } from 'typeorm';
import { Step } from './step.entity';
import { Vagas } from '../vagas/vagas.entity';

@Entity()
export class Edital extends AbstractEntity<Edital> {
  @Column({ type: 'text' })
  titulo_edital: string;

  @Column({ type: 'text', nullable: true })
  descricao?: string;

  @Column({ type: 'json', nullable: true })
  edital_url?: {
    titulo_documento: string;
    url_documento: string;
  }[];

  @Column({
    type: 'enum',
    enum: StatusEdital,
    //default: StatusEdital.RASCUNHO,
    nullable: true,
  })
  status_edital: StatusEdital;

  @Column({ type: 'json', nullable: true })
  etapa_edital?: {
    etapa: string;
    ordem_elemento: number;
    data_inicio: Date;
    data_fim: Date;
  }[];

  @OneToMany(() => Vagas, (vagas) => vagas.edital, { cascade: true })
  vagas: Vagas[];

  @OneToMany(() => Step, (step) => step.edital, { cascade: true })
  steps: Step[];

  constructor(entity: Partial<Edital>) {
    super();
    Object.assign(this, entity);
  }
}
