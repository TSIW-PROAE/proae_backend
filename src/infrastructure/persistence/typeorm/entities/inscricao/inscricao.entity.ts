import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { AbstractEntity } from '../../abstract.entity';
import { StatusInscricao } from 'src/core/shared-kernel/enums/enumStatusInscricao';
import { StatusBeneficioEdital } from 'src/core/shared-kernel/enums/enumStatusBeneficioEdital';
import { Aluno } from '../aluno/aluno.entity';
import { Documento } from '../documento/documento.entity';
import { Vagas } from '../vagas/vagas.entity';
import { Resposta } from '../resposta/resposta.entity';

@Entity()
export class Inscricao extends AbstractEntity<Inscricao> {
  @ManyToOne(() => Vagas, (vagas) => vagas.inscricoes)
  vagas: Vagas;

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  data_inscricao: Date;

  @Column({
    type: 'enum',
    enum: StatusInscricao,
    default: StatusInscricao.PENDENTE,
  })
  status_inscricao: StatusInscricao;

  /**
   * Benefício no edital (seleção/homologação), separado da análise documental
   * e do status da inscrição.
   */
  @Column({
    type: 'varchar',
    length: 80,
    default: StatusBeneficioEdital.PENDENTE_SELECAO,
  })
  status_beneficio_edital: StatusBeneficioEdital;

  @OneToMany(() => Documento, (documento) => documento.inscricao, {
    nullable: true,
    cascade: true,
  })
  documentos: Documento[];

  @OneToMany(() => Resposta, (resposta) => resposta.inscricao, {
    nullable: true,
    cascade: true,
  })
  respostas: Resposta[];

  @Column({ type: 'text', nullable: true })
  observacao_admin?: string;

  /** Publicação do resultado (não publicado, preliminar ou final). */
  @Column({ type: 'varchar', length: 32, default: 'Nao publicado' })
  resultado_fase: string;

  /** Situação do recurso administrativo do estudante. */
  @Column({ type: 'varchar', length: 32, default: 'Sem recurso' })
  recurso_status: string;

  /** Justificativa/parecer do recurso (opcional, visível ao estudante). */
  @Column({ type: 'text', nullable: true })
  recurso_observacao?: string | null;

  /** Momento da última publicação de resultado (preliminar/final). */
  @Column({ type: 'timestamp', nullable: true })
  resultado_publicado_em?: Date | null;

  /** Indica homologação acima de vagas por autorização administrativa. */
  @Column({ type: 'boolean', default: false })
  beneficio_override_vagas: boolean;

  /** Justificativa da autorização para exceder vagas. */
  @Column({ type: 'text', nullable: true })
  beneficio_override_justificativa?: string | null;

  /** Usuário/admin que autorizou exceder vagas. */
  @Column({ type: 'varchar', length: 255, nullable: true })
  beneficio_override_autorizado_por?: string | null;

  /** Momento da autorização de override de vagas. */
  @Column({ type: 'timestamp', nullable: true })
  beneficio_override_autorizado_em?: Date | null;

  /**
   * Pontos da análise técnica (barema) preenchidos pela equipe técnica no FG.
   * Máximos: cobertura (5), agravamento (5), situacional (10).
   */
  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  pontuacao_tecnica_cobertura: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  pontuacao_tecnica_agravamento: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  pontuacao_tecnica_situacional: number;

  @ManyToOne(() => Aluno, (aluno) => aluno.inscricoes)
  aluno: Aluno;

  constructor(entity: Partial<Inscricao>) {
    super();
    Object.assign(this, entity);
  }
}
