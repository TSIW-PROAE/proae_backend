import { AbstractEntity } from '@/src/db/abstract.entity';
import { EnumTipoInput } from '@/src/enum/enumTipoInput';
import { Column, Entity, OneToMany } from 'typeorm';
import { ValorDado } from '../valorDado/valorDado.entity';

@Entity()
export class Dado extends AbstractEntity<Dado> {
  @Column({ unique: true })
  nome: string;

  @Column({ type: 'enum', enum: EnumTipoInput })
  tipo: EnumTipoInput;

  @Column({ type: 'boolean', default: false })
  obrigatorio: boolean;

  @Column({ type: 'simple-array', nullable: true })
  opcoes: string[];


  @OneToMany(() => ValorDado, (valor) => valor.dado)
  valores: ValorDado[];
}
