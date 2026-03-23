import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { Validacao } from '../entities/validacao/validacao.entity';
import { Usuario } from '../entities/usuarios/usuario.entity';
import { Step } from '../entities/step/step.entity';
import { Documento } from '../entities/documento/documento.entity';
import { StatusValidacao } from '../../../../core/shared-kernel/enums/statusValidacao';
import type {
  ValidacaoData,
} from '../../../../core/domain/validacao/validacao.types';
import type { IValidacaoRepository } from '../../../../core/domain/validacao/ports/validacao.repository.port';

@Injectable()
export class ValidacaoTypeOrmRepository implements IValidacaoRepository {
  constructor(
    @InjectRepository(Validacao)
    private readonly validacaoRepository: Repository<Validacao>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(Step)
    private readonly stepRepository: Repository<Step>,
    @InjectRepository(Documento)
    private readonly documentoRepository: Repository<Documento>,
  ) {}

  async create(
    data: Omit<ValidacaoData, 'id'>,
  ): Promise<ValidacaoData> {
    const responsavel = await this.usuarioRepository.findOne({
      where: { usuario_id: data.responsavel_id },
    });
    if (!responsavel) throw new BadRequestException('Responsável não encontrado');

    let questionario: Step | undefined;
    if (data.questionario_id) {
      const q = await this.stepRepository.findOne({ where: { id: data.questionario_id } });
      if (!q) throw new BadRequestException('Questionário não encontrado');
      questionario = q;
    }

    let documento: Documento | undefined;
    if (data.documento_id) {
      const d = await this.documentoRepository.findOne({
        where: { documento_id: data.documento_id },
      });
      if (!d) throw new BadRequestException('Documento não encontrado');
      documento = d;
    }

    const validacao = new Validacao({
      parecer: data.parecer,
      data_validacao: data.data_validacao,
      status: data.status || StatusValidacao.PENDENTE,
      responsavel,
      questionario,
      documento,
    });
    const saved = await this.validacaoRepository.save(validacao);
    const full = await this.validacaoRepository.findOne({
      where: { id: saved.id },
      relations: ['responsavel', 'questionario', 'documento'],
    });
    return this.toValidacaoData(full!);
  }

  async findAll(): Promise<ValidacaoData[]> {
    const list = await this.validacaoRepository.find({
      relations: ['responsavel', 'questionario', 'documento'],
    });
    return list.map((v) => this.toValidacaoData(v));
  }

  async findOne(id: number): Promise<ValidacaoData | null> {
    const validacao = await this.validacaoRepository.findOne({
      where: { id },
      relations: ['responsavel', 'questionario', 'documento'],
    });
    if (!validacao) return null;
    return this.toValidacaoData(validacao);
  }

  async update(
    id: number,
    data: Partial<Omit<ValidacaoData, 'id'>>,
  ): Promise<ValidacaoData> {
    const validacao = await this.validacaoRepository.findOne({
      where: { id },
      relations: ['responsavel', 'questionario', 'documento'],
    });
    if (!validacao) throw new NotFoundException('Validação não encontrada');

    if (data.parecer !== undefined) validacao.parecer = data.parecer;
    if (data.data_validacao !== undefined) validacao.data_validacao = data.data_validacao;
    if (data.status !== undefined) validacao.status = data.status;

    if (data.responsavel_id) {
      const responsavel = await this.usuarioRepository.findOne({
        where: { usuario_id: data.responsavel_id },
      });
      if (!responsavel) throw new BadRequestException('Responsável não encontrado');
      validacao.responsavel = responsavel;
    }

    if (data.questionario_id !== undefined) {
      if (data.questionario_id) {
        const questionario = await this.stepRepository.findOne({
          where: { id: data.questionario_id },
        });
        if (!questionario) throw new BadRequestException('Questionário não encontrado');
        validacao.questionario = questionario;
      } else {
        validacao.questionario = undefined;
      }
    }

    if (data.documento_id !== undefined) {
      if (data.documento_id) {
        const documento = await this.documentoRepository.findOne({
          where: { documento_id: data.documento_id },
        });
        if (!documento) throw new BadRequestException('Documento não encontrado');
        validacao.documento = documento;
      } else {
        validacao.documento = undefined;
      }
    }

    const updated = await this.validacaoRepository.save(validacao);
    const full = await this.validacaoRepository.findOne({
      where: { id: updated.id },
      relations: ['responsavel', 'questionario', 'documento'],
    });
    return this.toValidacaoData(full!);
  }

  async remove(id: number): Promise<void> {
    const validacao = await this.validacaoRepository.findOneBy({ id });
    if (!validacao) throw new NotFoundException('Validação não encontrada');
    await this.validacaoRepository.delete({ id });
  }

  async aprovar(id: number): Promise<ValidacaoData> {
    const validacao = await this.validacaoRepository.findOne({
      where: { id },
      relations: ['responsavel', 'questionario', 'documento'],
    });
    if (!validacao) throw new NotFoundException('Validação não encontrada');
    validacao.status = StatusValidacao.APROVADO;
    validacao.data_validacao = new Date();
    const updated = await this.validacaoRepository.save(validacao);
    return this.toValidacaoData(updated);
  }

  async reprovar(id: number): Promise<ValidacaoData> {
    const validacao = await this.validacaoRepository.findOne({
      where: { id },
      relations: ['responsavel', 'questionario', 'documento'],
    });
    if (!validacao) throw new NotFoundException('Validação não encontrada');
    validacao.status = StatusValidacao.REPROVADO;
    validacao.data_validacao = new Date();
    const updated = await this.validacaoRepository.save(validacao);
    return this.toValidacaoData(updated);
  }

  async findByStatus(status: StatusValidacao): Promise<ValidacaoData[]> {
    const list = await this.validacaoRepository.find({
      where: { status },
      relations: ['responsavel', 'questionario', 'documento'],
    });
    return list.map((v) => this.toValidacaoData(v));
  }

  private toValidacaoData(entity: Validacao): ValidacaoData {
    return {
      id: entity.id,
      parecer: entity.parecer,
      status: entity.status,
      data_validacao: entity.data_validacao,
      responsavel_id: entity.responsavel?.usuario_id,
      questionario_id: entity.questionario?.id,
      documento_id: entity.documento?.documento_id,
      responsavel: entity.responsavel
        ? {
            usuario_id: entity.responsavel.usuario_id,
            nome: entity.responsavel.nome,
            email: entity.responsavel.email,
          }
        : undefined,
      questionario: entity.questionario
        ? {
            id: entity.questionario.id,
            texto: entity.questionario.texto,
          }
        : undefined,
    };
  }
}

