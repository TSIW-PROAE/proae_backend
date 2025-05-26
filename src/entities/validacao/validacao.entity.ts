import { Entity, Column } from 'typeorm';
import { StatusDocumento } from '../../enum/statusDocumento';
import { AbstractEntity } from '../../db/abstract.entity';

@Entity()
export class Validacao extends AbstractEntity<Validacao> {
    @Column({ type: 'enum', enum: StatusDocumento })
    status: StatusDocumento;

    @Column({ type: 'text', nullable: true })
    parecer: string;

    @Column({ type: 'date', nullable: true })
    data_validacao: Date;

    constructor(entity: Partial<Validacao>) {
        super();
        Object.assign(this, entity);
    }
} 