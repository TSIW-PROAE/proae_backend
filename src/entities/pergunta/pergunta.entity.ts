import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Resposta } from '../resposta/resposta.entity';

@Entity()
export class Pergunta {
  @PrimaryGeneratedColumn()
  pergunta_id: number;

  @Column()
  pergunta: string;

  @OneToMany(() => Resposta, (resposta) => resposta.pergunta)
  respostas: Resposta[];
}
