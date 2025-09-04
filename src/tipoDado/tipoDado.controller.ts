import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DadoService } from './tipoDado.service';
import { CreateDadoDto } from './dto/create-tipo-dado.dto';
import { UpdateDadoDto } from './dto/update-tipo-dado.dto';

@ApiTags('Dado e ValorDado')
@Controller('dado')
export class DadoController {
  constructor(private readonly dadoService: DadoService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo Dado' })
  @ApiResponse({ status: 201, description: 'Dado criado com sucesso.' })
  create(@Body() dto: CreateDadoDto) {
    return this.dadoService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os Dados' })
  findAll() {
    return this.dadoService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um Dado pelo ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.dadoService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um Dado pelo ID' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDadoDto) {
    return this.dadoService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um Dado pelo ID' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.dadoService.remove(id);
  }
}
