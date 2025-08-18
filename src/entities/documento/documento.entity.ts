import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EnumTipoDocumento } from '../../enum/enumTipoDocumento';
import { StatusDocumento } from '../../enum/statusDocumento';
import { Inscricao } from '../inscricao/inscricao.entity';
import { Validacao } from '../validacao/validacao.entity';

@Entity()
export class Documento {
  @PrimaryGeneratedColumn()
  documento_id: number;

  @ManyToOne(() => Inscricao, (inscricao) => inscricao.documentos)
  inscricao: Inscricao;

  @Column({ type: 'enum', enum: EnumTipoDocumento })
  tipo_documento: EnumTipoDocumento;

  @Column({ nullable: true })
  documento_url: string;

  @Column({
    type: 'enum',
    enum: StatusDocumento,
    default: StatusDocumento.NAO_ENVIADO,
  })
  status_documento: StatusDocumento;

  @OneToMany(() => Validacao, (validacao) => validacao.documento, {
    nullable: true,
    cascade: true,
  })
  validacoes: Validacao[];

  constructor(entity: Partial<Documento>) {
    Object.assign(this, entity);
  }
}
