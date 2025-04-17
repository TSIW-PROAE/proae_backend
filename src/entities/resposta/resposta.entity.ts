import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Pergunta } from '../pergunta/pergunta.entity';

@Entity()
export class Resposta {
  @PrimaryGeneratedColumn()
  resposta_id: number;

  @Column()
  resposta: string;

  @ManyToOne(() => Pergunta, (pergunta) => pergunta.respostas)
  pergunta: Pergunta;
}
