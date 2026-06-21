import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Aluno } from './aluno.entity';

@Entity({ name: 'aluno_matricula_historico' })
@Index('IDX_aluno_matricula_historico_aluno_id_created_at', ['aluno', 'created_at'])
export class AlunoMatriculaHistorico {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Aluno, (aluno) => aluno.matriculasHistorico, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'aluno_id' })
  aluno: Aluno;

  @Column({ type: 'varchar', length: 50 })
  matricula: string;

  @Column({ type: 'varchar', length: 100 })
  curso: string;

  @Column({ type: 'varchar', length: 64 })
  campus: string;

  @Column({ type: 'varchar', length: 32 })
  data_ingresso: string;

  @Column({ type: 'varchar', length: 32 })
  nivel_academico: string;

  @Column({ type: 'varchar', length: 80, default: 'atualizacao_cadastro' })
  motivo: string;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  created_at: Date;
}
