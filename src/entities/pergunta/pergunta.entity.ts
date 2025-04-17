import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Formulario } from '../formulario/formulario.entity';
import { Resposta } from '../resposta/resposta.entity';

@Entity()
export class Pergunta {
    @PrimaryGeneratedColumn()
    pergunta_id: number;

    @Column()
    pergunta: string;

    @ManyToOne(() => Formulario, (formulario) => formulario.perguntas)
    formulario: Formulario;

    @OneToMany(() => Resposta, (resposta) => resposta.pergunta)
    respostas: Resposta[]
}