import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Validacao } from '../entities/validacao/validacao.entity';
import { CreateValidacaoDto } from './dto/create-validacao.dto';
import { UpdateValidacaoDto } from './dto/update-validacao.dto';
import { ValidacaoResponseDto } from './dto/validacao-response.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ValidacaoService {
  constructor(
    @InjectRepository(Validacao)
    private readonly validacaoRepository: Repository<Validacao>,
  ) { }

  async create(createValidacaoDto: CreateValidacaoDto): Promise<ValidacaoResponseDto> {
    try {
      const validacao = new Validacao(createValidacaoDto);
      const saved = await this.validacaoRepository.save(validacao);
      return plainToInstance(ValidacaoResponseDto, saved, { excludeExtraneousValues: true });
    } catch (error) {
      const e = error as Error;
      console.error('Erro ao criar a validação:', error);
      throw new BadRequestException(`Erro ao criar validação: ${e.message}`);
    }
  }

  async findAll(): Promise<ValidacaoResponseDto[]> {
    try {
      const list = await this.validacaoRepository.find();
      return plainToInstance(ValidacaoResponseDto, list, { excludeExtraneousValues: true });
    } catch (error) {
      const e = error as Error;
      console.error('Erro ao buscar validações:', error);
      throw new BadRequestException(`Erro ao buscar validações: ${e.message}`);
    }
  }

  async findOne(id: number): Promise<ValidacaoResponseDto> {
    try {
      const validacao = await this.validacaoRepository.findOneBy({ id });
      if (!validacao) throw new NotFoundException('Validação não encontrada');
      return plainToInstance(ValidacaoResponseDto, validacao, { excludeExtraneousValues: true });
    } catch (error) {
      const e = error as Error;
      console.error('Erro ao buscar a validação:', error);
      throw new BadRequestException(`Erro ao buscar a validação: ${e.message}`);
    }
  }

  async update(id: number, updateValidacaoDto: UpdateValidacaoDto): Promise<ValidacaoResponseDto> {
    try {
      const validacao = await this.validacaoRepository.findOneBy({ id });
      if (!validacao) throw new NotFoundException('Validação não encontrada');
      Object.assign(validacao, updateValidacaoDto);
      const updated = await this.validacaoRepository.save(validacao);
      return plainToInstance(ValidacaoResponseDto, updated, { excludeExtraneousValues: true });
    } catch (error) {
      const e = error as Error;
      console.error('Erro ao atualizar a validação:', error);
      throw new BadRequestException(`Erro ao atualizar a validação: ${e.message}`);
    }
  }

  async remove(id: number) {
    try {
      const validacao = await this.validacaoRepository.findOneBy({ id });
      if (!validacao) throw new NotFoundException('Validação não encontrada');
      await this.validacaoRepository.delete(validacao);
      return { message: 'Validação removida com sucesso' };
    } catch (error) {
      const e = error as Error;
      console.error('Erro ao remover a validação:', error);
      throw new BadRequestException(`Erro ao remover a validação: ${e.message}`);
    }
  }
}
