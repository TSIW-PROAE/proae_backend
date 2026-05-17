import { AbstractEntity } from '../../abstract.entity';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { Edital } from '../edital/edital.entity';
import { Pergunta } from '../pergunta/pergunta.entity';

@Entity()
export class Step extends AbstractEntity<Step> {
  @ManyToOne(() => Edital, (edital) => edital.steps)
  edital: Edital;

  @Column({ type: 'varchar', length: 255 })
  texto: string;

  /**
   * Ordem do step dentro do edital. Quando dois ou mais steps têm a mesma ordem,
   * desempata por `id ASC` (preservando o comportamento histórico para registros
   * antigos cujo valor padrão é 0).
   */
  @Column({ type: 'int', default: 0 })
  ordem: number;

  @OneToMany(() => Pergunta, (pergunta) => pergunta.step, { cascade: true })
  perguntas: Pergunta[];

  constructor(entity: Partial<Step>) {
    super();
    Object.assign(this, entity);
  }
}
