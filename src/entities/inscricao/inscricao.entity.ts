import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  OneToOne,
} from 'typeorm';
import { Aluno } from '../aluno/aluno.entity';
import { Edital } from '../edital/edital.entity';
import { ResultadoEtapa } from '../resultadoEtapa/resultadoEtapa.entity';
import { Documento } from '../documento/documento.entity';
import { Formulario } from '../formulario/formulario.entity';
import { StatusInscricao } from '../../enum/enumStatusInscricao';

@Entity()
export class Inscricao {
  @PrimaryGeneratedColumn()
  inscricao_id: number;

  @ManyToOne(() => Aluno, (aluno) => aluno.inscricoes)
  aluno: Aluno;

  @ManyToOne(() => Edital, (edital) => edital.inscricoes)
  edital: Edital;

  @Column({ type: 'date' })
  data_inscricao: Date;

  @Column({ type: 'enum', enum: StatusInscricao, nullable: true })
  status_inscricao: StatusInscricao;

  @OneToMany(() => Documento, (documento) => documento.inscricao, {
    nullable: true,
  })
  documentos: Documento[];

  @OneToMany(() => ResultadoEtapa, (resultado) => resultado.inscricao, {
    nullable: true,
  })
  resultadosEtapas: ResultadoEtapa[];

  @OneToOne(() => Formulario, (formulario) => formulario.inscricao, {
    nullable: true,
  })
  formulario: Formulario;
}
