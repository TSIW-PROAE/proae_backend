import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Inscricao } from '../inscricao/inscricao.entity';
import { EnumTipoDocumento } from 'src/enum/enumTipoDocumento';
import { StatusDocumento } from 'src/enum/statusDocumento';

@Entity()

export class Documento {
    @PrimaryGeneratedColumn()
    documento_id: number;

    @ManyToOne(() => Inscricao, (inscricao) => inscricao.documentos)
    inscricao: Inscricao;

    @Column({ type: 'enum', enum: EnumTipoDocumento })
    tipo_documento: EnumTipoDocumento;

    @Column()
    documento_url: string;

    @Column({ type: 'enum', enum: StatusDocumento })
    status_documento: StatusDocumento;
}