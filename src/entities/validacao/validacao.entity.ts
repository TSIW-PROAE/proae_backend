import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AbstractEntity } from '../../db/abstract.entity';
import { Documento } from '../documento/documento.entity';
import { Usuario } from '../usuarios/usuario.entity';
import { Step } from '../step/step.entity';
import { StatusValidacao } from '../../enum/statusValidacao';

@Entity()
export class Validacao extends AbstractEntity<Validacao> {
  @Column({ type: 'text', nullable: true })
  parecer: string;

  @Column({ type: 'date', nullable: true })
  data_validacao: Date;

  @Column({ 
    type: 'enum', 
    enum: StatusValidacao, 
    default: StatusValidacao.PENDENTE 
  })
  status: StatusValidacao;

  // Relação com documento (mantida por enquanto)
  @ManyToOne(() => Documento, (documento) => documento.validacoes, { nullable: true })
  @JoinColumn({ name: 'documento_id' })
  documento?: Documento;

  // Relação com usuário responsável pela validação
  @ManyToOne(() => Usuario, { nullable: false })
  @JoinColumn({ name: 'responsavel_id' })
  responsavel: Usuario;

  // Relação com questionário (Step) do edital
  @ManyToOne(() => Step, { nullable: true })
  @JoinColumn({ name: 'questionario_id' })
  questionario?: Step;

  constructor(entity: Partial<Validacao>) {
    super();
    Object.assign(this, entity);
  }
}
