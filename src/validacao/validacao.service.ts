import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { Validacao } from '../entities/validacao/validacao.entity';
import { Usuario } from '../entities/usuarios/usuario.entity';
import { Step } from '../entities/step/step.entity';
import { Documento } from '../entities/documento/documento.entity';
import { StatusValidacao } from '../enum/statusValidacao';
import { CreateValidacaoDto } from './dto/create-validacao.dto';
import { UpdateValidacaoDto } from './dto/update-validacao.dto';
import { ValidacaoResponseDto } from './dto/validacao-response.dto';

@Injectable()
export class ValidacaoService {
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
    createValidacaoDto: CreateValidacaoDto,
  ): Promise<ValidacaoResponseDto> {
    try {
      // Buscar o responsável
      const responsavel = await this.usuarioRepository.findOne({
        where: { usuario_id: createValidacaoDto.responsavel_id },
      });
      if (!responsavel) {
        throw new BadRequestException('Responsável não encontrado');
      }

      // Buscar o questionário se fornecido
      let questionario: Step | undefined;
      if (createValidacaoDto.questionario_id) {
        const questionarioFound = await this.stepRepository.findOne({
          where: { id: createValidacaoDto.questionario_id },
        });
        if (!questionarioFound) {
          throw new BadRequestException('Questionário não encontrado');
        }
        questionario = questionarioFound;
      }

      // Buscar o documento se fornecido
      let documento: Documento | undefined;
      if (createValidacaoDto.documento_id) {
        const documentoFound = await this.documentoRepository.findOne({
          where: { documento_id: createValidacaoDto.documento_id },
        });
        if (!documentoFound) {
          throw new BadRequestException('Documento não encontrado');
        }
        documento = documentoFound;
      }

      const validacao = new Validacao({
        parecer: createValidacaoDto.parecer,
        data_validacao: createValidacaoDto.data_validacao,
        status: createValidacaoDto.status || StatusValidacao.PENDENTE,
        responsavel,
        questionario,
        documento,
      });

      const saved = await this.validacaoRepository.save(validacao);
      
      // Buscar a validação com as relações para retornar
      const validacaoCompleta = await this.validacaoRepository.findOne({
        where: { id: saved.id },
        relations: ['responsavel', 'questionario', 'documento'],
      });

      return plainToInstance(ValidacaoResponseDto, validacaoCompleta, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      const e = error as Error;
      console.error('Erro ao criar a validação:', error);
      throw new BadRequestException(`Erro ao criar validação: ${e.message}`);
    }
  }

  async findAll(): Promise<ValidacaoResponseDto[]> {
    try {
      const list = await this.validacaoRepository.find({
        relations: ['responsavel', 'questionario', 'documento'],
      });
      return plainToInstance(ValidacaoResponseDto, list, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      const e = error as Error;
      console.error('Erro ao buscar validações:', error);
      throw new BadRequestException(`Erro ao buscar validações: ${e.message}`);
    }
  }

  async findOne(id: number): Promise<ValidacaoResponseDto> {
    try {
      const validacao = await this.validacaoRepository.findOne({
        where: { id },
        relations: ['responsavel', 'questionario', 'documento'],
      });
      if (!validacao) throw new NotFoundException('Validação não encontrada');
      return plainToInstance(ValidacaoResponseDto, validacao, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const e = error as Error;
      console.error('Erro ao buscar a validação:', error);
      throw new BadRequestException(`Erro ao buscar a validação: ${e.message}`);
    }
  }

  async update(
    id: number,
    updateValidacaoDto: UpdateValidacaoDto,
  ): Promise<ValidacaoResponseDto> {
    try {
      const validacao = await this.validacaoRepository.findOne({
        where: { id },
        relations: ['responsavel', 'questionario', 'documento'],
      });
      if (!validacao) throw new NotFoundException('Validação não encontrada');

      // Atualizar campos básicos
      if (updateValidacaoDto.parecer !== undefined) {
        validacao.parecer = updateValidacaoDto.parecer;
      }
      if (updateValidacaoDto.data_validacao !== undefined) {
        validacao.data_validacao = updateValidacaoDto.data_validacao;
      }
      if (updateValidacaoDto.status !== undefined) {
        validacao.status = updateValidacaoDto.status;
      }

      // Atualizar responsável se fornecido
      if (updateValidacaoDto.responsavel_id) {
        const responsavel = await this.usuarioRepository.findOne({
          where: { usuario_id: updateValidacaoDto.responsavel_id },
        });
        if (!responsavel) {
          throw new BadRequestException('Responsável não encontrado');
        }
        validacao.responsavel = responsavel;
      }

      // Atualizar questionário se fornecido
      if (updateValidacaoDto.questionario_id !== undefined) {
        if (updateValidacaoDto.questionario_id) {
          const questionario = await this.stepRepository.findOne({
            where: { id: updateValidacaoDto.questionario_id },
          });
          if (!questionario) {
            throw new BadRequestException('Questionário não encontrado');
          }
          validacao.questionario = questionario;
        } else {
          validacao.questionario = undefined;
        }
      }

      // Atualizar documento se fornecido
      if (updateValidacaoDto.documento_id !== undefined) {
        if (updateValidacaoDto.documento_id) {
          const documento = await this.documentoRepository.findOne({
            where: { documento_id: updateValidacaoDto.documento_id },
          });
          if (!documento) {
            throw new BadRequestException('Documento não encontrado');
          }
          validacao.documento = documento;
        } else {
          validacao.documento = undefined;
        }
      }

      const updated = await this.validacaoRepository.save(validacao);
      
      // Buscar a validação atualizada com as relações
      const validacaoAtualizada = await this.validacaoRepository.findOne({
        where: { id: updated.id },
        relations: ['responsavel', 'questionario', 'documento'],
      });

      return plainToInstance(ValidacaoResponseDto, validacaoAtualizada, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const e = error as Error;
      console.error('Erro ao atualizar a validação:', error);
      throw new BadRequestException(
        `Erro ao atualizar a validação: ${e.message}`,
      );
    }
  }

  async remove(id: number): Promise<{ message: string }> {
    try {
      const validacao = await this.validacaoRepository.findOneBy({ id });
      if (!validacao) throw new NotFoundException('Validação não encontrada');
      await this.validacaoRepository.delete({ id });
      return { message: 'Validação removida com sucesso' };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const e = error as Error;
      console.error('Erro ao remover a validação:', error);
      throw new BadRequestException(
        `Erro ao remover a validação: ${e.message}`,
      );
    }
  }

  async aprovarValidacao(id: number): Promise<ValidacaoResponseDto> {
    try {
      const validacao = await this.validacaoRepository.findOne({
        where: { id },
        relations: ['responsavel', 'questionario', 'documento'],
      });
      if (!validacao) throw new NotFoundException('Validação não encontrada');

      validacao.status = StatusValidacao.APROVADO;
      validacao.data_validacao = new Date();

      const updated = await this.validacaoRepository.save(validacao);
      
      return plainToInstance(ValidacaoResponseDto, updated, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const e = error as Error;
      console.error('Erro ao aprovar validação:', error);
      throw new BadRequestException(`Erro ao aprovar validação: ${e.message}`);
    }
  }

  async reprovarValidacao(id: number): Promise<ValidacaoResponseDto> {
    try {
      const validacao = await this.validacaoRepository.findOne({
        where: { id },
        relations: ['responsavel', 'questionario', 'documento'],
      });
      if (!validacao) throw new NotFoundException('Validação não encontrada');

      validacao.status = StatusValidacao.REPROVADO;
      validacao.data_validacao = new Date();

      const updated = await this.validacaoRepository.save(validacao);
      
      return plainToInstance(ValidacaoResponseDto, updated, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const e = error as Error;
      console.error('Erro ao reprovar validação:', error);
      throw new BadRequestException(`Erro ao reprovar validação: ${e.message}`);
    }
  }

  async getValidacoesByStatus(status: StatusValidacao): Promise<ValidacaoResponseDto[]> {
    try {
      const validacoes = await this.validacaoRepository.find({
        where: { status },
        relations: ['responsavel', 'questionario', 'documento'],
      });
      return plainToInstance(ValidacaoResponseDto, validacoes, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      const e = error as Error;
      console.error('Erro ao buscar validações por status:', error);
      throw new BadRequestException(`Erro ao buscar validações por status: ${e.message}`);
    }
  }
}
