import { Column, Entity, ManyToOne } from 'typeorm';
import { Dado } from '../tipoDado/tipoDado.entity';
import { AbstractEntity } from '@/src/db/abstract.entity';
import { Aluno } from '../aluno/aluno.entity';

@Entity()
export class ValorDado extends AbstractEntity<ValorDado> {
  @Column({ type: 'text', nullable: true })
  valorTexto: string;

  @Column({ type: 'simple-array', nullable: true })
  valorOpcoes: string[];

  @Column({ type: 'varchar', length: 500, nullable: true })
  valorArquivo: string;

  @ManyToOne(() => Dado, (dado) => dado.valores, {
    onDelete: 'CASCADE',
  })
  dado: Dado;

  @ManyToOne(() => Aluno, (aluno) => aluno.valoresDado, {
    onDelete: 'CASCADE',
  })
  aluno: Aluno;
}
