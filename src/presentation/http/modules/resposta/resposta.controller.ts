import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
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
import { Roles } from 'src/common/decorators/roles';
import { RolesEnum } from 'src/core/shared-kernel/enums/enumRoles';
import { JwtAuthGuard } from 'src/presentation/http/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/presentation/http/modules/auth/guards/roles.guard';
import { CreateRespostaDto } from './dto/create-resposta.dto';
import { ReabrirComplementoDto } from './dto/reabrir-complemento.dto';
import { RespostaResponseDto } from './dto/response-resposta.dto';
import { UpdateRespostaDto } from './dto/update-resposta.dto';
import { ValidateRespostaDto } from './dto/validate-resposta.dto';
import { RespostaService } from './resposta.service';

@ApiTags('Respostas')
@Controller('respostas')
@UseGuards(JwtAuthGuard)
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
    description:
      'Retorna uma lista com todas as respostas cadastradas no sistema',
  })
  @ApiOkResponse({
    type: [RespostaResponseDto],
    description: 'Lista de respostas encontrada com sucesso',
  })
  findAll() {
    return this.respostaService.findAll();
  }

  // ——— Rotas estáticas ANTES de :id ———

  @Get('aluno/:alunoId/edital/:editalId/steps-completos')
  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @ApiOperation({
    summary: 'Todos os steps do edital com perguntas e respostas do aluno',
    description:
      'Usado no gerenciamento de inscrições (PROAE): visão completa por step com status.',
  })
  @ApiParam({ name: 'alunoId', description: 'ID do aluno', type: 'number' })
  @ApiParam({ name: 'editalId', description: 'ID do edital', type: 'number' })
  findAllStepsComPerguntasRespostas(
    @Param('alunoId', ParseIntPipe) alunoId: number,
    @Param('editalId', ParseIntPipe) editalId: number,
  ) {
    return this.respostaService.findAllStepsComPerguntasRespostas(
      alunoId,
      editalId,
    );
  }

  @Get('aluno/:alunoId/edital/:editalId')
  @ApiOperation({ summary: 'Respostas do aluno no edital' })
  findRespostasAlunoEdital(
    @Param('alunoId', ParseIntPipe) alunoId: number,
    @Param('editalId', ParseIntPipe) editalId: number,
  ) {
    return this.respostaService.findRespostasAlunoEdital(alunoId, editalId);
  }

  @Get('aluno/:alunoId/edital/:editalId/step/:stepId')
  @ApiOperation({ summary: 'Respostas do aluno em um step' })
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

  @Get(
    'aluno/:alunoId/edital/:editalId/step/:stepId/perguntas-com-respostas',
  )
  @ApiOperation({ summary: 'Perguntas do step com respostas do aluno' })
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
  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Respostas de uma pergunta no edital (admin)' })
  findRespostasPerguntaEdital(
    @Param('perguntaId', ParseIntPipe) perguntaId: number,
    @Param('editalId', ParseIntPipe) editalId: number,
  ) {
    return this.respostaService.findRespostasPerguntaEdital(
      perguntaId,
      editalId,
    );
  }

  @Patch(':id/reabrir-complemento')
  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Reabrir prazo de complemento (nova pergunta)' })
  @ApiParam({ name: 'id', description: 'ID da resposta', type: 'number' })
  @ApiBody({ type: ReabrirComplementoDto })
  reabrirComplemento(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReabrirComplementoDto,
  ) {
    return this.respostaService.reabrirComplemento(id, dto.novoPrazo);
  }

  @Patch(':id/validate')
  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @ApiOperation({
    summary: 'Validar / invalidar uma resposta',
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
}
