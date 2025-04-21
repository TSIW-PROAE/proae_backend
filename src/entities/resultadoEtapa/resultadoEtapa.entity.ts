import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Inscricao } from '../inscricao/inscricao.entity';
import { EtapaInscricao } from '../etapaInscricao/etapaInscricao.entity';
import { StatusEtapa } from '../../enum/enumStatusEtapa';

@Entity()
export class ResultadoEtapa {
  @PrimaryGeneratedColumn()
  resultado_id: number;

  @ManyToOne(() => Inscricao, (inscricao) => inscricao.resultadosEtapas)
  inscricao: Inscricao;

  @ManyToOne(() => EtapaInscricao, (etapa) => etapa.resultados)
  etapa: EtapaInscricao;

  @Column({ type: 'enum', enum: StatusEtapa })
  status_etapa: StatusEtapa;

  @Column({ type: 'text' })
  observacao: string;

  @Column({ type: 'date' })
  data_avaliacao: Date;
}
