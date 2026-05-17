import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Edital } from 'src/infrastructure/persistence/typeorm/entities/edital/edital.entity';
import { Step } from 'src/infrastructure/persistence/typeorm/entities/step/step.entity';
import { Pergunta } from 'src/infrastructure/persistence/typeorm/entities/pergunta/pergunta.entity';

export interface CloneFormularioCommand {
  editalOrigemId: number;
  editalAlvoId: number;
  /**
   * Quando true, apaga steps já existentes no edital alvo antes da cópia.
   * Útil para garantir um clone fiel; cuidado pois remove em cascata as
   * perguntas (e respostas vinculadas).
   */
  substituirExistente?: boolean;
}

export interface CloneFormularioResult {
  stepsCriados: number;
  perguntasCriadas: number;
}

/**
 * Clona o formulário (steps + perguntas, com `ordem`, `opcoes`, `tipo_formatacao`,
 * vínculo com `dado` e `condicao`) entre dois editais distintos. Roda em transação
 * para garantir consistência. Re-mapeia os IDs de origem das condições para os
 * IDs das perguntas recém-criadas.
 */
@Injectable()
export class CloneFormularioUseCase {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async execute(cmd: CloneFormularioCommand): Promise<CloneFormularioResult> {
    if (cmd.editalOrigemId === cmd.editalAlvoId) {
      throw new NotFoundException(
        'Edital de origem e destino não podem ser iguais.',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const origem = await manager.findOne(Edital, {
        where: { id: cmd.editalOrigemId },
      });
      if (!origem) {
        throw new NotFoundException(
          `Edital de origem ${cmd.editalOrigemId} não encontrado.`,
        );
      }
      const alvo = await manager.findOne(Edital, {
        where: { id: cmd.editalAlvoId },
      });
      if (!alvo) {
        throw new NotFoundException(
          `Edital de destino ${cmd.editalAlvoId} não encontrado.`,
        );
      }

      const stepsOrigem = await manager.find(Step, {
        where: { edital: { id: cmd.editalOrigemId } },
        relations: { perguntas: { dado: true } },
        order: { ordem: 'ASC', id: 'ASC' },
      });

      if (cmd.substituirExistente) {
        // delete cascade vai limpar perguntas/respostas
        const existentes = await manager.find(Step, {
          where: { edital: { id: cmd.editalAlvoId } },
        });
        if (existentes.length) {
          await manager.delete(Step, existentes.map((s) => s.id));
        }
      }

      let stepsCriados = 0;
      let perguntasCriadas = 0;
      const mapaPerguntasOrigemAlvo = new Map<number, number>();
      // Primeiro: criar steps + perguntas (sem condicao, para garantir mapping)
      const novosStepsComPerguntasOrigem: {
        novoStep: Step;
        perguntasOrigem: Pergunta[];
      }[] = [];

      for (const stepOrig of stepsOrigem) {
        const novoStep = manager.create(Step, {
          texto: stepOrig.texto,
          ordem: stepOrig.ordem ?? 0,
          edital: { id: cmd.editalAlvoId } as Edital,
        });
        const stepSalvo = await manager.save(novoStep);
        stepsCriados += 1;

        const perguntasOrdenadas = (stepOrig.perguntas ?? [])
          .slice()
          .sort((a, b) => {
            const oa = a.ordem ?? 0;
            const ob = b.ordem ?? 0;
            return oa === ob ? a.id - b.id : oa - ob;
          });

        for (const pOrig of perguntasOrdenadas) {
          const novaPergunta = manager.create(Pergunta, {
            tipo_Pergunta: pOrig.tipo_Pergunta,
            pergunta: pOrig.pergunta,
            obrigatoriedade: pOrig.obrigatoriedade,
            opcoes: pOrig.opcoes ?? [],
            tipo_formatacao: pOrig.tipo_formatacao ?? undefined,
            ordem: pOrig.ordem ?? 0,
            condicao: null, // popula em segunda passada com IDs novos
            step: { id: stepSalvo.id } as Step,
            dado: pOrig.dado ? ({ id: pOrig.dado.id } as Pergunta['dado']) : undefined,
          });
          const perguntaSalva = await manager.save(novaPergunta);
          mapaPerguntasOrigemAlvo.set(pOrig.id, perguntaSalva.id);
          perguntasCriadas += 1;
        }

        novosStepsComPerguntasOrigem.push({
          novoStep: stepSalvo,
          perguntasOrigem: perguntasOrdenadas,
        });
      }

      // Segunda passada: aplicar `condicao` re-mapeada (a pergunta-origem
      // deve referir-se ao ID novo, não ao antigo).
      for (const grupo of novosStepsComPerguntasOrigem) {
        for (const pOrig of grupo.perguntasOrigem) {
          if (!pOrig.condicao) continue;
          const novoIdOrigem = mapaPerguntasOrigemAlvo.get(
            pOrig.condicao.pergunta_id_origem,
          );
          // Se a origem da condição não foi clonada (não estava no formulário),
          // preserva null para evitar referenciar pergunta de outro edital.
          if (!novoIdOrigem) continue;
          const novoIdPergunta = mapaPerguntasOrigemAlvo.get(pOrig.id);
          if (!novoIdPergunta) continue;
          await manager.update(Pergunta, novoIdPergunta, {
            condicao: {
              pergunta_id_origem: novoIdOrigem,
              operador: pOrig.condicao.operador,
              valor: pOrig.condicao.valor,
            },
          });
        }
      }

      return { stepsCriados, perguntasCriadas };
    });
  }
}
