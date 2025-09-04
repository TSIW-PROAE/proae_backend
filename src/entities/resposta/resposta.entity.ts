import { AbstractEntity } from 'src/db/abstract.entity';
import { Column, Entity, ManyToOne, CreateDateColumn } from 'typeorm';
import { Pergunta } from '../pergunta/pergunta.entity';
import { Inscricao } from '../inscricao/inscricao.entity';

@Entity()
export class Resposta extends AbstractEntity<Resposta> {
  @ManyToOne(() => Pergunta, (pergunta) => pergunta.respostas, {
    onDelete: 'CASCADE',
  })
  pergunta: Pergunta;

  @ManyToOne(() => Inscricao, (inscricao) => inscricao.respostas, {
    onDelete: 'CASCADE',
  })
  inscricao: Inscricao;

  @Column({ type: 'text', nullable: true })
  valorTexto?: string;

  @Column({ type: 'simple-array', nullable: true })
  valorOpcoes?: string[];

  @Column({ type: 'varchar', length: 500, nullable: true })
  urlArquivo?: string;

  @Column({ type: 'text', nullable: true })
  texto?: string;

  @CreateDateColumn()
  dataResposta: Date;
}
