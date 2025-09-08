import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FormularioService } from './formulario.service';
import { Formulario } from '../entities/formulario/formulario.entity';
import { CreateFormularioDto } from './dto/create-formulario.dto';
import { UpdateFormularioDto } from './dto/update-formulario.dto';

@ApiTags('Formulários')
@Controller('formularios')
export class FormularioController {
  constructor(private readonly formularioService: FormularioService) {}

  @Post()
  @ApiOperation({ summary: 'Criar um novo formulário' })
  @ApiResponse({
    status: 201,
    description: 'Formulário criado com sucesso',
    type: Formulario,
  })
  create(@Body() dto: CreateFormularioDto) {
    return this.formularioService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os formulários' })
  @ApiResponse({
    status: 200,
    description: 'Lista de formulários',
    type: [Formulario],
  })
  findAll() {
    return this.formularioService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar formulário por ID' })
  @ApiResponse({
    status: 200,
    description: 'Formulário encontrado',
    type: Formulario,
  })
  @ApiResponse({ status: 404, description: 'Formulário não encontrado' })
  findOne(@Param('id') id: number) {
    return this.formularioService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar formulário por ID' })
  @ApiResponse({
    status: 200,
    description: 'Formulário atualizado',
    type: Formulario,
  })
  @ApiResponse({ status: 404, description: 'Formulário não encontrado' })
  update(@Param('id') id: number, @Body() dto: UpdateFormularioDto) {
    return this.formularioService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover formulário por ID' })
  @ApiResponse({ status: 200, description: 'Formulário removido' })
  @ApiResponse({ status: 404, description: 'Formulário não encontrado' })
  remove(@Param('id') id: number) {
    return this.formularioService.remove(id);
  }
}
