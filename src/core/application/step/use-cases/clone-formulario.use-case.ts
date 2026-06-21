import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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

      /** Só clona steps que de fato têm perguntas (evita cascata de "Questionário" vazio). */
      const stepsComPerguntas = stepsOrigem.filter(
        (s) => (s.perguntas?.length ?? 0) > 0,
      );

      if (!stepsComPerguntas.length) {
        throw new BadRequestException(
          'O edital de origem não possui questionários com perguntas para importar.',
        );
      }

      if (cmd.substituirExistente) {
        // delete cascade vai limpar perguntas/respostas
        const existentes = await manager.find(Step, {
          where: { edital: { id: cmd.editalAlvoId } },
        });
        if (existentes.length) {
          await manager.delete(Step, existentes.map((s) => s.id));
        }
      }

      /** Ao acrescentar, remove shells vazios no alvo antes de copiar (abrir editor sem salvar pergunta). */
      let proximaOrdemStep = 0;
      if (!cmd.substituirExistente) {
        const existentesAlvo = await manager.find(Step, {
          where: { edital: { id: cmd.editalAlvoId } },
          relations: { perguntas: true },
          order: { ordem: 'ASC', id: 'ASC' },
        });
        const vaziosAlvo = existentesAlvo.filter(
          (s) => (s.perguntas?.length ?? 0) === 0,
        );
        if (vaziosAlvo.length) {
          await manager.delete(Step, vaziosAlvo.map((s) => s.id));
        }
        const restantes = existentesAlvo.filter(
          (s) => (s.perguntas?.length ?? 0) > 0,
        );
        if (restantes.length) {
          proximaOrdemStep =
            Math.max(...restantes.map((s) => s.ordem ?? 0)) + 1;
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

      for (const stepOrig of stepsComPerguntas) {
        const ordemStep = cmd.substituirExistente
          ? (stepOrig.ordem ?? 0)
          : proximaOrdemStep++;
        const novoStep = manager.create(Step, {
          texto: stepOrig.texto,
          ordem: ordemStep,
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
            pontuacao_validacao: Number(
              (pOrig as any).pontuacao_validacao ?? 0,
            ),
            condicao: null, // popula em segunda passada com IDs novos
            step: stepSalvo,
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
