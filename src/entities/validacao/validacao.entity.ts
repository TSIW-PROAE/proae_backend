import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../db/abstract.entity';
import { Documento } from '../documento/documento.entity';

@Entity()
export class Validacao extends AbstractEntity<Validacao> {
  @Column({ type: 'text', nullable: true })
  parecer: string;

  @Column({ type: 'date', nullable: true })
  data_validacao: Date;

  @ManyToOne(() => Documento, (documento) => documento.validacoes)
  @JoinColumn({ name: 'documento_id' })
  documento: Documento;

  constructor(entity: Partial<Validacao>) {
    super();
    Object.assign(this, entity);
  }
}
