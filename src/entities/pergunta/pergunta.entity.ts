import { AbstractEntity } from 'src/db/abstract.entity';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { EnumInputFormat } from '../../enum/enumInputFormat';
import { EnumTipoInput } from '../../enum/enumTipoInput';
import { Step } from '../step/step.entity';
import { Dado } from '../tipoDado/tipoDado.entity';
import { Resposta } from '../resposta/resposta.entity';

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

  @ManyToOne(() => Dado, { nullable: true })
  dado?: Dado;
}
