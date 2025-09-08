import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Formulario } from '../entities/formulario/formulario.entity';
import { Pergunta } from '../entities/pergunta/pergunta.entity';
import { CreateFormularioDto } from './dto/create-formulario.dto';
import { UpdateFormularioDto } from './dto/update-formulario.dto';

@Injectable()
export class FormularioService {
  constructor(
    @InjectRepository(Formulario)
    private formularioRepo: Repository<Formulario>,
    @InjectRepository(Pergunta)
    private perguntaRepo: Repository<Pergunta>,
  ) {}

  async create(dto: CreateFormularioDto): Promise<Formulario> {
    const { perguntas, ...formularioData } = dto;

    const formulario = this.formularioRepo.create(formularioData);
    await this.formularioRepo.save(formulario);

    if (perguntas && perguntas.length > 0) {
      const perguntasEntities = perguntas.map((p) =>
        this.perguntaRepo.create({ ...p, formulario }),
      );
      await this.perguntaRepo.save(perguntasEntities);
      formulario.perguntas = perguntasEntities;
    }

    return formulario;
  }

  async findAll(): Promise<Formulario[]> {
    return this.formularioRepo.find({ relations: ['perguntas'] });
  }

  async findOne(id: number): Promise<Formulario> {
    const formulario = await this.formularioRepo.findOne({
      where: { id },
      relations: ['perguntas'],
    });
    if (!formulario)
      throw new NotFoundException(`Formulário ${id} não encontrado`);
    return formulario;
  }

  async update(id: number, dto: UpdateFormularioDto): Promise<Formulario> {
    const formulario = await this.findOne(id);

    Object.assign(formulario, dto);
    await this.formularioRepo.save(formulario);

    if (dto.perguntas) {
      await this.perguntaRepo.delete({ formulario: { id } });
      const perguntasEntities = dto.perguntas.map((p) =>
        this.perguntaRepo.create({ ...p, formulario }),
      );
      await this.perguntaRepo.save(perguntasEntities);
      formulario.perguntas = perguntasEntities;
    }

    return formulario;
  }

  async remove(id: number): Promise<void> {
    await this.formularioRepo.delete(id);
  }
}
