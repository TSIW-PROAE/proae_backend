import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as cpfLib from 'validation-br/dist/cpf';
import { Repository } from 'typeorm';
import { Usuario } from '../entities/usuarios/usuario.entity';
import { StatusDocumento } from '../../../../core/shared-kernel/enums/statusDocumento';
import type { AlunoData, AtualizaAlunoData } from '../../../../core/domain/aluno/aluno.types';
import type { IAlunoRepository } from '../../../../core/domain/aluno/ports/aluno.repository.port';

/**
 * Implementação do repositório de Aluno usando TypeORM (Adapter).
 * A infraestrutura depende do domínio (porta); o domínio não depende da infra.
 */
@Injectable()
export class AlunoTypeOrmRepository implements IAlunoRepository {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  async findByUserId(userId: string): Promise<AlunoData | null> {
    const usuario = await this.usuarioRepository.findOne({
      where: { usuario_id: userId },
      relations: ['aluno', 'aluno.inscricoes'],
    });
    if (!usuario?.aluno) return null;
    return this.toAlunoData(usuario);
  }

  async findAll(): Promise<AlunoData[]> {
    const usuarios = await this.usuarioRepository.find({
      relations: ['aluno', 'aluno.inscricoes'],
    });
    return usuarios
      .filter((u) => u.aluno)
      .map((u) => this.toAlunoData(u!));
  }

  async updateByUserId(
    userId: string,
    data: AtualizaAlunoData,
  ): Promise<AlunoData> {
    const usuario = await this.usuarioRepository.findOne({
      where: { usuario_id: userId },
      relations: ['aluno'],
    });
    if (!usuario?.aluno) {
      throw new Error('Aluno não encontrado');
    }

    if (data.email && data.email !== usuario.email) {
      const emailExistente = await this.usuarioRepository.findOne({
        where: { email: data.email },
      });
      if (emailExistente) {
        throw new Error('Email já está em uso.');
      }
      usuario.email = data.email;
    }
    if (data.nome) usuario.nome = data.nome;
    if (data.celular) usuario.celular = data.celular;
    if (data.dataNascimento) usuario.data_nascimento = new Date(data.dataNascimento);

    if (data.cpf !== undefined && String(data.cpf).trim() !== '') {
      const digits = String(data.cpf).replace(/\D/g, '');
      const masked = cpfLib.mask(digits);
      if (masked !== usuario.cpf) {
        const outroCpf = await this.usuarioRepository.findOne({
          where: { cpf: masked },
        });
        if (outroCpf && outroCpf.usuario_id !== usuario.usuario_id) {
          throw new Error('CPF já cadastrado.');
        }
        usuario.cpf = masked;
      }
    }

    Object.assign(usuario.aluno!, {
      matricula: data.matricula ?? usuario.aluno.matricula,
      curso: data.curso ?? usuario.aluno.curso,
      campus: data.campus ?? usuario.aluno.campus,
      data_ingresso: data.dataIngresso ?? usuario.aluno.data_ingresso,
    });

    await this.usuarioRepository.save(usuario);
    const updated = await this.usuarioRepository.findOne({
      where: { usuario_id: userId },
      relations: ['aluno', 'aluno.inscricoes'],
    });
    return this.toAlunoData(updated!);
  }

  async hasReprovadoDocuments(userId: string): Promise<boolean> {
    const usuario = await this.usuarioRepository.findOne({
      where: { usuario_id: userId },
      relations: ['aluno', 'aluno.inscricoes', 'aluno.inscricoes.documentos'],
    });
    if (!usuario?.aluno) return false;
    for (const inscricao of usuario.aluno.inscricoes ?? []) {
      if (
        inscricao.documentos?.some(
          (doc) => doc.status_documento === StatusDocumento.REPROVADO,
        )
      ) {
        return true;
      }
    }
    return false;
  }

  private toAlunoData(usuario: Usuario): AlunoData {
    const aluno = usuario.aluno!;
    return {
      alunoId: aluno.aluno_id,
      matricula: aluno.matricula,
      curso: aluno.curso,
      campus: aluno.campus,
      dataIngresso: aluno.data_ingresso,
      usuarioId: usuario.usuario_id,
      email: usuario.email,
      nome: usuario.nome,
      cpf: usuario.cpf,
      celular: usuario.celular,
      dataNascimento: usuario.data_nascimento,
      inscricoes: aluno.inscricoes?.map((i) => ({ ...i })) ?? [],
    };
  }
}
