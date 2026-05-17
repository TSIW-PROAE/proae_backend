import { AbstractEntity } from '../../abstract.entity';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { EnumInputFormat } from 'src/core/shared-kernel/enums/enumInputFormat';
import { EnumTipoInput } from 'src/core/shared-kernel/enums/enumTipoInput';
import { Step } from '../step/step.entity';
import { Dado } from '../tipoDado/tipoDado.entity';
import { Resposta } from '../resposta/resposta.entity';

/**
 * Estrutura da condição de exibição (opcional). Quando definida, a pergunta só
 * aparece para o aluno se a resposta da pergunta `pergunta_id_origem` casar com
 * a regra (`operador` aplicado a `valor`).
 *
 * Operadores aceitos hoje (alinhados com `frontend/src/utils/conditionalLogic.ts`):
 * - `equals`     — escalar igual
 * - `notEquals`  — escalar diferente
 * - `includes`   — aluno selecionou esse valor (multi-escolha)
 * - `notIncludes`
 */
export interface PerguntaCondicao {
  pergunta_id_origem: number;
  operador: 'equals' | 'notEquals' | 'includes' | 'notIncludes';
  valor: string | string[];
}

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

  /**
   * Ordem da pergunta dentro do step. Reordenar não exclui registros: o
   * controller atualiza apenas este campo. Desempate: `id ASC`.
   */
  @Column({ type: 'int', default: 0 })
  ordem: number;

  /**
   * Regra de exibição condicional. Null = sempre visível.
   */
  @Column({ type: 'jsonb', nullable: true })
  condicao?: PerguntaCondicao | null;

  @ManyToOne(() => Step, (step) => step.perguntas)
  step: Step;

  @OneToMany(() => Resposta, (resposta) => resposta.pergunta)
  respostas: Resposta[];

  @ManyToOne(() => Dado, { nullable: true })
  dado?: Dado;
}
