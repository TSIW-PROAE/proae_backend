import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { StatusBeneficio } from '../../enum/enumStatusBeneficio';
import { Inscricao } from '../inscricao/inscricao.entity';
  
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