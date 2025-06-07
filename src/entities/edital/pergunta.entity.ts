import { Entity, Column, OneToMany, ManyToOne } from 'typeorm';
import { EnumTipoInput } from '../../enum/enumTipoInput';
import { EnumInputFormat } from '../../enum/enumInputFormat';
import { Step } from './step.entity';
import { AbstractEntity } from 'src/db/abstract.entity';
import { Resposta } from '../inscricao/resposta.entity';

@Entity()
export class Pergunta extends AbstractEntity<Pergunta> {
  @Column({ type: 'enum', enum: EnumTipoInput })
  tipo_Pergunta: EnumTipoInput;

  @Column({ type: 'varchar', length: 255 })
  pergunta: string;

  @Column({ type: 'boolean', default: false })
  obrigatoriedade: boolean;

  @Column({ type: 'simple-array', nullable: true })
  opcoes: string[];

  @Column({ type: 'enum', enum: EnumInputFormat, nullable: true })
  tipo_formatacao: EnumInputFormat;
  
  @ManyToOne(() => Step, (step) => step.perguntas)
  step: Step;

  @OneToMany(() => Resposta, (resposta) => resposta.pergunta)
  respostas: Resposta[];

  constructor(entity: Partial<Pergunta>) {
    super();
    Object.assign(this, entity);
  }
}
