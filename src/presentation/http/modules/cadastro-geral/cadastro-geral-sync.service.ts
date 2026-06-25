import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Aluno } from 'src/infrastructure/persistence/typeorm/entities/aluno/aluno.entity';
import { Edital } from 'src/infrastructure/persistence/typeorm/entities/edital/edital.entity';
import { SituacaoCadastroGeral } from 'src/core/shared-kernel/enums/enumSituacaoCadastroGeral';
import { StatusInscricao } from 'src/core/shared-kernel/enums/enumStatusInscricao';
import {
  addSemestres,
  inferirSemestreReferencia,
} from 'src/core/shared-kernel/utils/cg-semestre.util';

@Injectable()
export class CadastroGeralSyncService {
  constructor(
    @InjectRepository(Aluno)
    private readonly alunoRepository: Repository<Aluno>,
  ) {}

  async onInscricaoCgCriada(alunoId: number): Promise<void> {
    const aluno = await this.alunoRepository.findOne({ where: { aluno_id: alunoId } });
    if (!aluno) return;
    if (aluno.cg_situacao === SituacaoCadastroGeral.APTO) return;
    aluno.cg_situacao = SituacaoCadastroGeral.PENDENTE;
    await this.alunoRepository.save(aluno);
  }

  async onAdminAtualizouInscricaoCg(opts: {
    alunoId: number;
    edital: Edital;
    statusInscricao: StatusInscricao;
    marcarPcdCg?: boolean;
  }): Promise<void> {
    const aluno = await this.alunoRepository.findOne({ where: { aluno_id: opts.alunoId } });
    if (!aluno) return;

    if (opts.marcarPcdCg === true) {
      aluno.cg_pcd = true;
    }

    if (opts.statusInscricao === StatusInscricao.APROVADA) {
      const ref = inferirSemestreReferencia(
        opts.edital.titulo_edital,
        opts.edital.descricao,
      );
      aluno.cg_situacao = SituacaoCadastroGeral.APTO;
      aluno.cg_semestre_referencia = ref;
      aluno.cg_valido_ate_semestre = addSemestres(ref, 4);
      await this.alunoRepository.save(aluno);
      return;
    }

    if (opts.statusInscricao === StatusInscricao.NEGADA) {
      aluno.cg_situacao = SituacaoCadastroGeral.INAPTO;
      await this.alunoRepository.save(aluno);
    }
  }
}
