import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Edital } from '../edital/edital.entity';
import { ResultadoEtapa } from '../resultadoEtapa/resultadoEtapa.entity';

@Entity()
export class EtapaInscricao {
    @PrimaryGeneratedColumn()
    etapa_id: number;

    @ManyToOne(() => Edital, (edital) => edital.etapas)
    edital: Edital;

    @Column()
    nome_etapa: string;

    @Column()
    ordem_etapa: number;

    @Column({ type: 'text' })
    descricao_etapa: string;

    @OneToMany(() => ResultadoEtapa, (resultado) => resultado.etapa)
    resultados: ResultadoEtapa[];
}