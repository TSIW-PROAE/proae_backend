import { AbstractEntity } from 'src/db/abstract.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { Inscricao } from './inscricao.entity';
import { Pergunta } from '../pergunta/pergunta.entity';

@Entity()
export class Resposta extends AbstractEntity<Resposta> {
  @ManyToOne(() => Inscricao, (inscricao) => inscricao.respostas)
  inscricao: Inscricao;

  @ManyToOne(() => Pergunta, (pergunta) => pergunta.respostas)
  pergunta: Pergunta;

  @Column({ type: 'varchar', length: 255 })
  texto: string;

  constructor(entity: Partial<Resposta>) {
    super();
    Object.assign(this, entity);
  }
}