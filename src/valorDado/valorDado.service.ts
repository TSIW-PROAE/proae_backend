import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateValorDadoDto } from './dto/create-valor-dado.dto';
import { Dado } from '../entities/tipoDado/tipoDado.entity';
import { ValorDado } from '../entities/valorDado/valorDado.entity';
import { Aluno } from '../entities/aluno/aluno.entity';

@Injectable()
export class ValorDadoService {
  constructor(
    @InjectRepository(Dado)
    private readonly dadoRepo: Repository<Dado>,

    @InjectRepository(ValorDado)
    private readonly valorDadoRepo: Repository<ValorDado>,

    @InjectRepository(Aluno)
    private readonly alunoRepo: Repository<Aluno>,
  ) {}

  async createValor(dto: CreateValorDadoDto): Promise<ValorDado> {
    const aluno = await this.alunoRepo.findOneBy({ aluno_id: dto.alunoId });
    if (!aluno) throw new NotFoundException('Aluno não encontrado');

    const dado = await this.dadoRepo.findOneBy({ id: dto.dadoId });
    if (!dado) throw new NotFoundException('Dado não encontrado');

    const valor = this.valorDadoRepo.create({ aluno, dado, ...dto });
    return this.valorDadoRepo.save(valor);
  }

  async findValorByAluno(alunoId: string): Promise<ValorDado[]> {
    return this.valorDadoRepo.find({
      where: { aluno: { aluno_id: alunoId } },
      relations: ['dado'],
    });
  }

  async updateValor(id: string, dto: CreateValorDadoDto): Promise<ValorDado> {
    const valor = await this.valorDadoRepo.findOne({ where: { id } });
    if (!valor) throw new NotFoundException('ValorDado não encontrado');
    Object.assign(valor, dto);
    return this.valorDadoRepo.save(valor);
  }

  async removeValor(id: string): Promise<void> {
    const valor = await this.valorDadoRepo.findOne({ where: { id } });
    if (!valor) throw new NotFoundException('ValorDado não encontrado');
    await this.valorDadoRepo.remove(valor);
  }
}
