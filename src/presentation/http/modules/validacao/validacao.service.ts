import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { StatusValidacao } from 'src/core/shared-kernel/enums/statusValidacao';
import { CreateValidacaoDto } from './dto/create-validacao.dto';
import { UpdateValidacaoDto } from './dto/update-validacao.dto';
import { ValidacaoResponseDto } from './dto/validacao-response.dto';
import { AprovarValidacaoUseCase } from 'src/core/application/validacao/use-cases/aprovar-validacao.use-case';
import { CreateValidacaoUseCase } from 'src/core/application/validacao/use-cases/create-validacao.use-case';
import { FindAllValidacoesUseCase } from 'src/core/application/validacao/use-cases/find-all-validacoes.use-case';
import { FindValidacaoByIdUseCase } from 'src/core/application/validacao/use-cases/find-validacao-by-id.use-case';
import { FindValidacoesByStatusUseCase } from 'src/core/application/validacao/use-cases/find-validacoes-by-status.use-case';
import { RemoveValidacaoUseCase } from 'src/core/application/validacao/use-cases/remove-validacao.use-case';
import { ReprovarValidacaoUseCase } from 'src/core/application/validacao/use-cases/reprovar-validacao.use-case';
import { UpdateValidacaoUseCase } from 'src/core/application/validacao/use-cases/update-validacao.use-case';

@Injectable()
export class ValidacaoService {
  constructor(
    private readonly createValidacaoUseCase: CreateValidacaoUseCase,
    private readonly findAllValidacoesUseCase: FindAllValidacoesUseCase,
    private readonly findValidacaoByIdUseCase: FindValidacaoByIdUseCase,
    private readonly updateValidacaoUseCase: UpdateValidacaoUseCase,
    private readonly removeValidacaoUseCase: RemoveValidacaoUseCase,
    private readonly aprovarValidacaoUseCase: AprovarValidacaoUseCase,
    private readonly reprovarValidacaoUseCase: ReprovarValidacaoUseCase,
    private readonly findValidacoesByStatusUseCase: FindValidacoesByStatusUseCase,
  ) {}

  async create(
    createValidacaoDto: CreateValidacaoDto,
  ): Promise<ValidacaoResponseDto> {
    try {
      const validacao = await this.createValidacaoUseCase.execute({
        parecer: createValidacaoDto.parecer,
        data_validacao: createValidacaoDto.data_validacao,
        status: createValidacaoDto.status || StatusValidacao.PENDENTE,
        responsavel_id: createValidacaoDto.responsavel_id,
        questionario_id: createValidacaoDto.questionario_id,
        documento_id: createValidacaoDto.documento_id,
      });
      return plainToInstance(ValidacaoResponseDto, validacao, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const e = error as Error;
      console.error('Erro ao criar a validação:', error);
      throw new BadRequestException(`Erro ao criar validação: ${e.message}`);
    }
  }

  async findAll(): Promise<ValidacaoResponseDto[]> {
    try {
      const list = await this.findAllValidacoesUseCase.execute();
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
      const validacao = await this.findValidacaoByIdUseCase.execute(id);
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
      const validacaoAtualizada = await this.updateValidacaoUseCase.execute(id, {
        parecer: updateValidacaoDto.parecer,
        data_validacao: updateValidacaoDto.data_validacao,
        status: updateValidacaoDto.status,
        responsavel_id: updateValidacaoDto.responsavel_id,
        questionario_id: updateValidacaoDto.questionario_id,
        documento_id: updateValidacaoDto.documento_id,
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
      await this.removeValidacaoUseCase.execute(id);
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
      const updated = await this.aprovarValidacaoUseCase.execute(id);
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
      const updated = await this.reprovarValidacaoUseCase.execute(id);
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

  async getValidacoesByStatus(
    status: StatusValidacao,
  ): Promise<ValidacaoResponseDto[]> {
    try {
      const validacoes = await this.findValidacoesByStatusUseCase.execute(status);
      return plainToInstance(ValidacaoResponseDto, validacoes, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      const e = error as Error;
      console.error('Erro ao buscar validações por status:', error);
      throw new BadRequestException(
        `Erro ao buscar validações por status: ${e.message}`,
      );
    }
  }
}
