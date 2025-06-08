import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Inscricao } from '../inscricao/inscricao.entity';
import { StatusBeneficio } from '../../enum/enumStatusBeneficio';

@Entity()
export class Beneficio {
  @PrimaryGeneratedColumn()
  beneficio_id: number;

  @OneToOne(() => Inscricao, (inscricao) => inscricao.beneficio)
  @JoinColumn()
  inscricao: Inscricao;

  @Column({ type: 'date' })
  data_inicio: Date;

  @Column({ type: 'enum', enum: StatusBeneficio, nullable: true })
  status_beneficio: StatusBeneficio;
}
