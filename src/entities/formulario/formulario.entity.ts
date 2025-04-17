import { Entity, PrimaryGeneratedColumn, Column, OneToOne, OneToMany } from 'typeorm';
import { Inscricao } from '../inscricao/inscricao.entity';
import { Pergunta } from '../pergunta/pergunta.entity';

@Entity()
export class Formulario{
    @PrimaryGeneratedColumn()
    formulario_id: number; 

    @Column()
    titulo_formulario: string; 

    @OneToMany(() => Pergunta, (pergunta) => pergunta.formulario)
    perguntas: Pergunta[];

    @OneToOne(() => Inscricao, (inscricao) => inscricao.formulario)
    inscricao: Inscricao;
}