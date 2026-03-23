import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../abstract.entity';
import { Documento } from '../documento/documento.entity';
import { Usuario } from '../usuarios/usuario.entity';
import { Step } from '../step/step.entity';
import { StatusValidacao } from 'src/core/shared-kernel/enums/statusValidacao';

@Entity()
export class Validacao extends AbstractEntity<Validacao> {
  @Column({ type: 'text', nullable: true })
  parecer: string;

  @Column({ type: 'date', nullable: true })
  data_validacao: Date;

  @Column({
    type: 'enum',
    enum: StatusValidacao,
    default: StatusValidacao.PENDENTE,
  })
  status: StatusValidacao;

  @ManyToOne(() => Documento, (documento) => documento.validacoes, { nullable: true })
  @JoinColumn({ name: 'documento_id' })
  documento?: Documento;

  @ManyToOne(() => Usuario, { nullable: false })
  @JoinColumn({ name: 'responsavel_id' })
  responsavel: Usuario;

  @ManyToOne(() => Step, { nullable: true })
  @JoinColumn({ name: 'questionario_id' })
  questionario?: Step;

  constructor(entity: Partial<Validacao>) {
    super();
    Object.assign(this, entity);
  }
}
