import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CreateRespostaDto } from './dto/create-resposta.dto';
import { RespostaResponseDto } from './dto/response-resposta.dto';
import { UpdateRespostaDto } from './dto/update-resposta.dto';
import { ValidateRespostaDto } from './dto/validate-resposta.dto';
import { RespostaService } from './resposta.service';

@ApiTags('Respostas')
@Controller('respostas')
export class RespostaController {
  constructor(private readonly respostaService: RespostaService) {}

  @Post()
  @ApiOperation({
    summary: 'Criar uma nova resposta',
    description: 'Cria uma nova resposta para uma pergunta de uma inscrição',
  })
  @ApiCreatedResponse({
    type: RespostaResponseDto,
    description: 'Resposta criada com sucesso',
  })
  @ApiNotFoundResponse({
    description: 'Pergunta ou inscrição não encontrada',
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos fornecidos',
  })
  create(@Body() dto: CreateRespostaDto) {
    return this.respostaService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar todas as respostas',
    description: 'Retorna uma lista com todas as respostas cadastradas no sistema',
  })
  @ApiOkResponse({
    type: [RespostaResponseDto],
    description: 'Lista de respostas encontrada com sucesso',
  })
  findAll() {
    return this.respostaService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar resposta por ID',
    description: 'Retorna os dados de uma resposta específica pelo seu ID',
  })
  @ApiParam({ name: 'id', description: 'ID da resposta', type: 'number' })
  @ApiOkResponse({
    type: RespostaResponseDto,
    description: 'Resposta encontrada com sucesso',
  })
  @ApiNotFoundResponse({ description: 'Resposta não encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.respostaService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar uma resposta',
    description: 'Atualiza os dados de uma resposta existente',
  })
  @ApiParam({ name: 'id', description: 'ID da resposta', type: 'number' })
  @ApiOkResponse({
    type: RespostaResponseDto,
    description: 'Resposta atualizada com sucesso',
  })
  @ApiNotFoundResponse({ description: 'Resposta não encontrada' })
  @ApiBadRequestResponse({
    description: 'Dados inválidos fornecidos',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRespostaDto,
  ) {
    return this.respostaService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remover uma resposta',
    description: 'Remove uma resposta do sistema',
  })
  @ApiParam({ name: 'id', description: 'ID da resposta', type: 'number' })
  @ApiOkResponse({ description: 'Resposta removida com sucesso' })
  @ApiNotFoundResponse({ description: 'Resposta não encontrada' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.respostaService.remove(id);
  }

  @Get('aluno/:alunoId/edital/:editalId')
  findRespostasAlunoEdital(
    @Param('alunoId', ParseIntPipe) alunoId: number,
    @Param('editalId', ParseIntPipe) editalId: number,
  ) {
    return this.respostaService.findRespostasAlunoEdital(alunoId, editalId);
  }

  @Get('aluno/:alunoId/edital/:editalId/step/:stepId')
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

  @Get('aluno/:alunoId/edital/:editalId/step/:stepId/perguntas-com-respostas')
  findPerguntasComRespostasAlunoStep(
    @Param('alunoId', ParseIntPipe) alunoId: number,
    @Param('editalId', ParseIntPipe) editalId: number,
    @Param('stepId', ParseIntPipe) stepId: number,
  ) {
    return this.respostaService.findPerguntasComRespostasAlunoStep(
      alunoId,
      editalId,
      stepId,
    );
  }

  @Get('pergunta/:perguntaId/edital/:editalId')
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
  })
  @ApiParam({ name: 'id', description: 'ID da resposta', type: 'number' })
  @ApiBody({
    type: ValidateRespostaDto,
    description: 'Dados para validação da resposta',
  })
  validateResposta(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ValidateRespostaDto,
  ) {
    return this.respostaService.validateResposta(id, dto);
  }
}
