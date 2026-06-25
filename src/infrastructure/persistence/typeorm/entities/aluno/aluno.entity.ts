import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UnidadeEnum } from 'src/core/shared-kernel/enums/enumCampus';
import { NivelAcademico } from 'src/core/shared-kernel/enums/enumNivelAcademico';
import { SituacaoCadastroGeral } from 'src/core/shared-kernel/enums/enumSituacaoCadastroGeral';
import { Inscricao } from '../inscricao/inscricao.entity';
import { ValorDado } from '../valorDado/valorDado.entity';
import { Usuario } from '../usuarios/usuario.entity';
import { AlunoMatriculaHistorico } from './aluno-matricula-historico.entity';

@Entity()
export class Aluno {
  @PrimaryGeneratedColumn()
  aluno_id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  matricula: string;

  @Column({ type: 'varchar', length: 100 })
  curso: string;

  @Column({ type: 'enum', enum: UnidadeEnum })
  campus: UnidadeEnum;

  @Column()
  data_ingresso: string;

  /** Graduação ou Pós-graduação: filtra editais, FG, renovação e regras de inscrição. */
  @Column({
    type: 'varchar',
    length: 32,
    default: NivelAcademico.GRADUACAO,
  })
  nivel_academico: NivelAcademico;

  /**
   * Se false, o estudante precisa clicar no link enviado ao email antes de usar o portal
   * (exceto contas com admin já aprovado, que pulam essa etapa).
   * Registros antigos: default true na migration.
   * `name` explícito evita divergência com o banco; use sempre a coluna `cadastro_email_confirmado`.
   */
  @Column({ name: 'cadastro_email_confirmado', type: 'boolean', default: true })
  cadastroEmailConfirmado: boolean;

  /** Situação no Cadastro Geral (CG) da PROAE. */
  @Column({
    type: 'varchar',
    length: 32,
    default: SituacaoCadastroGeral.NAO_CADASTRADO,
  })
  cg_situacao: SituacaoCadastroGeral;

  /** PCD registrada no CG (permite até 2 modalidades no edital de benefícios). */
  @Column({ type: 'boolean', default: false })
  cg_pcd: boolean;

  /** Semestre em que o CG foi deferido (ex.: 2026.1). */
  @Column({ type: 'varchar', length: 16, nullable: true })
  cg_semestre_referencia?: string | null;

  /** Último semestre de vigência da análise socioeconômica (semestre apto + 4 seguintes). */
  @Column({ type: 'varchar', length: 16, nullable: true })
  cg_valido_ate_semestre?: string | null;

  @OneToMany(() => Inscricao, (inscricao) => inscricao.aluno)
  inscricoes: Inscricao[];

  @OneToMany(() => ValorDado, (valor) => valor.aluno)
  valoresDado: ValorDado[];

  @OneToMany(() => AlunoMatriculaHistorico, (historico) => historico.aluno)
  matriculasHistorico: AlunoMatriculaHistorico[];

  /** Uma conta (Usuario) pode ter no máximo um Aluno. UNIQUE garantido pela migration. */
  @OneToOne(() => Usuario, (usuario: Usuario) => usuario.aluno, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  usuario!: Usuario;
}
