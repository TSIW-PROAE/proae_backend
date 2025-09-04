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
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { CreateValorDadoDto } from '../valorDado/dto/create-valor-dado.dto';
import { ValorDadoService } from './valorDado.service';

@ApiTags('Dado e ValorDado')
@Controller('valor-dado')
export class ValorDadoController {
  constructor(private readonly valorDadoService: ValorDadoService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo ValorDado para um Aluno' })
  @ApiBody({ type: CreateValorDadoDto })
  @ApiResponse({ status: 201, description: 'ValorDado criado com sucesso.' })
  createValor(@Body() dto: CreateValorDadoDto) {
    return this.valorDadoService.createValor(dto);
  }

  @Get('aluno/:alunoId')
  @ApiOperation({ summary: 'Lista todos os Valores de um Aluno' })
  findValorByAluno(@Param('alunoId', ParseIntPipe) alunoId: number) {
    return this.valorDadoService.findValorByAluno(alunoId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um ValorDado pelo ID' })
  @ApiBody({ type: CreateValorDadoDto })
  @ApiResponse({ status: 200, description: 'ValorDado atualizado com sucesso.' })
  updateValor(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateValorDadoDto,
  ) {
    return this.valorDadoService.updateValor(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um ValorDado pelo ID' })
  removeValor(@Param('id', ParseIntPipe) id: number) {
    return this.valorDadoService.removeValor(id);
  }
}
