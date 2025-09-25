import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dado } from '../entities/tipoDado/tipoDado.entity';
import { CreateDadoDto } from './dto/create-tipo-dado.dto';
import { UpdateDadoDto } from './dto/update-tipo-dado.dto';

@Injectable()
export class DadoService {
  constructor(
    @InjectRepository(Dado)
    private readonly dadoRepo: Repository<Dado>,
  ) {}

  async create(dto: CreateDadoDto): Promise<Dado> {
    const dado = this.dadoRepo.create(dto);
    return this.dadoRepo.save(dado);
  }

  async findAll(): Promise<Dado[]> {
    return this.dadoRepo.find({ relations: ['valores'] });
  }

  async findOne(id: number): Promise<Dado> {
    const dado = await this.dadoRepo.findOne({
      where: { id },
      relations: ['valores'],
    });
    if (!dado) throw new NotFoundException('Dado não encontrado');
    return dado;
  }

  async update(id: number, dto: UpdateDadoDto): Promise<Dado> {
    const dado = await this.findOne(id);
    Object.assign(dado, dto);
    return this.dadoRepo.save(dado);
  }

  async remove(id: number): Promise<void> {
    const dado = await this.findOne(id);
    await this.dadoRepo.remove(dado);
  }
}
