import { StatusEdital } from 'src/core/shared-kernel/enums/enumStatusEdital';
import { NivelAcademico } from 'src/core/shared-kernel/enums/enumNivelAcademico';
import { AbstractEntity } from '../../abstract.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { Step } from '../step/step.entity';
import { Vagas } from '../vagas/vagas.entity';

@Entity()
export class Edital extends AbstractEntity<Edital> {
  @Column({ type: 'text' })
  titulo_edital: string;

  @Column({ type: 'text', nullable: true })
  descricao?: string;

  @Column({ type: 'json', nullable: true })
  edital_url?: {
    titulo_documento: string;
    url_documento: string;
  }[];

  @Column({
    type: 'enum',
    enum: StatusEdital,
    nullable: true,
  })
  status_edital: StatusEdital;

  /** Quando true, este edital é o Formulário Geral. Só pode haver um ativo. Aluno precisa ter inscrição aprovada nele para se inscrever em outros editais. */
  @Column({ type: 'boolean', default: false })
  is_formulario_geral: boolean;

  /** Formulário de renovação (recadastro). Quem já teve inscrição aprovada precisa concluí-lo quando estiver aberto para voltar a se inscrever em editais. */
  @Column({ type: 'boolean', default: false })
  is_formulario_renovacao: boolean;

  /** Graduação ou Pós-graduação (processos separados). */
  @Column({
    type: 'varchar',
    length: 32,
    default: NivelAcademico.GRADUACAO,
  })
  nivel_academico: NivelAcademico;

  /** Após esta data o vínculo/participação neste edital deixa de estar ativa para o aluno (avisos no portal). */
  @Column({ type: 'date', nullable: true })
  data_fim_vigencia?: Date | null;

  @Column({ type: 'json', nullable: true })
  etapa_edital?: {
    etapa: string;
    ordem_elemento: number;
    data_inicio: Date;
    data_fim: Date;
  }[];

  @OneToMany(() => Vagas, (vagas) => vagas.edital, { cascade: true })
  vagas: Vagas[];

  @OneToMany(() => Step, (step) => step.edital, { cascade: true })
  steps: Step[];

  constructor(entity: Partial<Edital>) {
    super();
    Object.assign(this, entity);
  }
}
