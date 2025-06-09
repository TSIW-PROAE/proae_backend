import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { StatusDocumento } from '../../enum/statusDocumento';
import { AbstractEntity } from '../../db/abstract.entity';
import { Documento } from '../documento/documento.entity';

@Entity()
export class Validacao extends AbstractEntity<Validacao> {
    @Column({ type: 'enum', enum: StatusDocumento })
    status: StatusDocumento;

    @Column({ type: 'text', nullable: true })
    parecer: string;

    @Column({ type: 'date', nullable: true })
    data_validacao: Date;

    @ManyToOne(() => Documento, (documento) => documento.validacoes)
    @JoinColumn({ name: 'documento_id' })
    documento: Documento;

    constructor(entity: Partial<Validacao>) {
        super();
        Object.assign(this, entity);
    }
} 