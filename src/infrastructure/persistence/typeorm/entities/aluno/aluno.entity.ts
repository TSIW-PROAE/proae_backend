import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UnidadeEnum } from 'src/core/shared-kernel/enums/enumCampus';
import { Inscricao } from '../inscricao/inscricao.entity';
import { ValorDado } from '../valorDado/valorDado.entity';
import { Usuario } from '../usuarios/usuario.entity';

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

  /**
   * Se false, o estudante precisa clicar no link enviado ao email antes de usar o portal
   * (exceto contas com admin já aprovado, que pulam essa etapa).
   * Registros antigos: default true na migration.
   * `name` explícito evita divergência com o banco; use sempre a coluna `cadastro_email_confirmado`.
   */
  @Column({ name: 'cadastro_email_confirmado', type: 'boolean', default: true })
  cadastroEmailConfirmado: boolean;

  @OneToMany(() => Inscricao, (inscricao) => inscricao.aluno)
  inscricoes: Inscricao[];

  @OneToMany(() => ValorDado, (valor) => valor.aluno)
  valoresDado: ValorDado[];

  /** Uma conta (Usuario) pode ter no máximo um Aluno. UNIQUE garantido pela migration. */
  @OneToOne(() => Usuario, (usuario: Usuario) => usuario.aluno, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  usuario!: Usuario;
}
