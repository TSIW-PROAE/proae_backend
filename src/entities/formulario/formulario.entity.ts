import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { EnumTipoForm } from '@/src/enum/enumTipoForm';
import { Pergunta } from '../pergunta/pergunta.entity';

@Entity('formulario')
export class Formulario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  titulo: string;

  @Column({ type: 'enum', enum: EnumTipoForm })
  tipo_formulario: EnumTipoForm;

  @OneToMany(() => Pergunta, (pergunta) => pergunta.formulario)
  perguntas: Pergunta[];
}
