import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { RespostaService } from './resposta.service';
import { CreateRespostaDto } from './dto/create-resposta.dto';
import { UpdateRespostaDto } from './dto/update-resposta.dto';
import { ValidateRespostaDto } from './dto/validate-resposta.dto';
import {
  ApiTags,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { RespostaResponseDto } from './dto/response-resposta.dto';

@ApiTags('Respostas')
@Controller('respostas')
export class RespostaController {
  constructor(private readonly respostaService: RespostaService) {}

  @Post()
  @ApiCreatedResponse({
    type: RespostaResponseDto,
    description: 'Resposta criada com sucesso',
  })
  create(@Body() dto: CreateRespostaDto) {
    return this.respostaService.create(dto);
  }

  @Get()
  @ApiOkResponse({
    type: [RespostaResponseDto],
    description: 'Lista de respostas',
  })
  findAll() {
    return this.respostaService.findAll();
  }

  @Get(':id')
  @ApiOkResponse({
    type: RespostaResponseDto,
    description: 'Resposta encontrada',
  })
  @ApiNotFoundResponse({ description: 'Resposta não encontrada' })
  findOne(@Param('id') id: number) {
    return this.respostaService.findOne(id);
  }

  @Patch(':id')
  @ApiOkResponse({
    type: RespostaResponseDto,
    description: 'Resposta atualizada',
  })
  @ApiNotFoundResponse({ description: 'Resposta não encontrada' })
  update(@Param('id') id: number, @Body() dto: UpdateRespostaDto) {
    return this.respostaService.update(id, dto);
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Resposta removida' })
  @ApiNotFoundResponse({ description: 'Resposta não encontrada' })
  remove(@Param('id') id: number) {
    return this.respostaService.remove(id);
  }

  @Get('aluno/:alunoId/edital/:editalId')
  @ApiOperation({
    summary: 'Todas as respostas de um aluno em um edital',
    description:
      'Retorna todas as respostas de um aluno específico em um edital específico',
  })
  @ApiParam({ name: 'alunoId', description: 'ID do aluno', type: 'number' })
  @ApiParam({ name: 'editalId', description: 'ID do edital', type: 'number' })
  @ApiOkResponse({ description: 'Respostas encontradas com sucesso' })
  @ApiNotFoundResponse({
    description: 'Aluno, edital ou respostas não encontradas',
  })
  findRespostasAlunoEdital(
    @Param('alunoId', ParseIntPipe) alunoId: number,
    @Param('editalId', ParseIntPipe) editalId: number,
  ) {
    return this.respostaService.findRespostasAlunoEdital(alunoId, editalId);
  }

  @Get('aluno/:alunoId/edital/:editalId/step/:stepId')
  @ApiOperation({
    summary: 'Todas as respostas de um aluno em um questionário específico',
    description:
      'Retorna todas as respostas de um aluno em um step específico de um edital',
  })
  @ApiParam({ name: 'alunoId', description: 'ID do aluno', type: 'number' })
  @ApiParam({ name: 'editalId', description: 'ID do edital', type: 'number' })
  @ApiParam({
    name: 'stepId',
    description: 'ID do step/questionário',
    type: 'number',
  })
  @ApiOkResponse({ description: 'Respostas encontradas com sucesso' })
  @ApiNotFoundResponse({
    description: 'Aluno, edital, step ou respostas não encontradas',
  })
  findRespostasAlunoStep(
    @Param('alunoId', ParseIntPipe) alunoId: number,
    @Param('editalId', ParseIntPipe) editalId: number,
    @Param('stepId', ParseIntPipe) stepId: number,
  ) {
    return this.respostaService.findRespostasAlunoStep(
      alunoId,
      editalId,
      stepId,
    );
  }

  @Get('pergunta/:perguntaId/edital/:editalId')
  @ApiOperation({
    summary: 'Todas as respostas de uma pergunta em um edital',
    description:
      'Retorna todas as respostas de uma pergunta específica em um edital, incluindo dados básicos dos alunos',
  })
  @ApiParam({
    name: 'perguntaId',
    description: 'ID da pergunta',
    type: 'number',
  })
  @ApiParam({ name: 'editalId', description: 'ID do edital', type: 'number' })
  @ApiOkResponse({ description: 'Respostas encontradas com sucesso' })
  @ApiNotFoundResponse({
    description: 'Pergunta, edital ou respostas não encontradas',
  })
  findRespostasPerguntaEdital(
    @Param('perguntaId', ParseIntPipe) perguntaId: number,
    @Param('editalId', ParseIntPipe) editalId: number,
  ) {
    return this.respostaService.findRespostasPerguntaEdital(
      perguntaId,
      editalId,
    );
  }

  @Patch(':id/validate')
  @ApiOperation({
    summary: 'Validar uma resposta',
    description:
      'Valida uma resposta específica e, se vinculada a um dado, adiciona o valor na tabela de dados do aluno',
  })
  @ApiParam({ name: 'id', description: 'ID da resposta', type: 'number' })
  @ApiOkResponse({
    description: 'Resposta validada com sucesso',
    schema: {
      example: {
        sucesso: true,
        dados: {
          resposta: {
            id: 1,
            validada: true,
            dataValidacao: '2024-01-27T10:00:00.000Z',
            dataValidade: '2024-12-31T23:59:59.000Z',
          },
          mensagem: 'Resposta validada com sucesso',
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Resposta não encontrada' })
  @ApiBadRequestResponse({
    description: 'Resposta já foi validada',
    schema: {
      example: {
        statusCode: 400,
        message: 'Resposta já foi validada',
        timestamp: '2024-01-27T10:00:00.000Z',
      },
    },
  })
  validateResposta(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ValidateRespostaDto,
  ) {
    return this.respostaService.validateResposta(id, dto);
  }
}
