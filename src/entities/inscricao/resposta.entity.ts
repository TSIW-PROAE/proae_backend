import { Entity, Column, ManyToOne } from 'typeorm';
import { Pergunta } from '../edital/pergunta.entity';
import { Inscricao } from './inscricao.entity';
import { AbstractEntity } from 'src/db/abstract.entity';

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
