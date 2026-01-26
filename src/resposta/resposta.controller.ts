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
  ApiBody,
} from '@nestjs/swagger';
import { RespostaResponseDto } from './dto/response-resposta.dto';
import { StepRespostasResponseDto } from './dto/step-respostas.dto';

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

  @Get('aluno/:alunoId/step/:stepId/edital/:editalId')
  @ApiOperation({
    summary: 'Buscar perguntas de um step com respostas do aluno',
    description:
      'Retorna todas as perguntas de um step específico com suas respectivas respostas do aluno (mesmo que não tenha respondido)',
  })
  @ApiParam({ name: 'alunoId', description: 'ID do aluno', type: 'number' })
  @ApiParam({ name: 'stepId', description: 'ID do step', type: 'number' })
  @ApiParam({ name: 'editalId', description: 'ID do edital', type: 'number' })
  @ApiOkResponse({
    type: StepRespostasResponseDto,
    description: 'Perguntas e respostas encontradas com sucesso',
  })
  @ApiNotFoundResponse({
    description: 'Aluno, step ou edital não encontrado',
  })
  @ApiBadRequestResponse({
    description: 'O step não pertence ao edital especificado',
  })
  findRespostasByAlunoStepEdital(
    @Param('alunoId', ParseIntPipe) alunoId: number,
    @Param('stepId', ParseIntPipe) stepId: number,
    @Param('editalId', ParseIntPipe) editalId: number,
  ) {
    return this.respostaService.findRespostasByAlunoStepEdital(
      alunoId,
      stepId,
      editalId,
    );
  }

  @Get('aluno/:alunoId/edital/:editalId')
  @ApiOperation({
    summary: 'Todas as respostas de um aluno em um edital',
    description:
      'Retorna todas as respostas de um aluno específico em um edital específico',
  })
  @ApiParam({ name: 'alunoId', description: 'ID do aluno', type: 'number' })
  @ApiParam({ name: 'editalId', description: 'ID do edital', type: 'number' })
  @ApiOkResponse({
    description: 'Respostas encontradas com sucesso',
    schema: {
      example: {
        sucesso: true,
        dados: {
          edital: {
            id: 1,
            titulo: 'Edital de Bolsa 2024',
            descricao: 'Edital para bolsas de estudo',
            status: 'Aberto',
          },
          aluno: {
            aluno_id: 1,
            nome: 'João Silva',
            email: 'joao@exemplo.com',
            matricula: '2024001',
          },
          total_respostas: 5,
          respostas: [
            {
              id: 1,
              pergunta_id: 1,
              pergunta_texto: 'Qual sua renda familiar?',
              step_id: 1,
              step_texto: 'Questionário socioeconômico',
              resposta_texto: 'Renda entre 1 e 3 salários mínimos',
              valor_texto: null,
              valor_opcoes: null,
              url_arquivo: null,
              data_resposta: '2024-01-15T10:00:00.000Z',
            },
          ],
        },
      },
    },
  })
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
  @ApiOkResponse({
    description: 'Respostas encontradas com sucesso',
    schema: {
      example: {
        sucesso: true,
        dados: {
          edital: {
            id: 1,
            titulo: 'Edital de Bolsa 2024',
            descricao: 'Edital para bolsas de estudo',
            status: 'Aberto',
          },
          step: {
            id: 1,
            texto: 'Questionário socioeconômico',
          },
          aluno: {
            aluno_id: 1,
            nome: 'João Silva',
            email: 'joao@exemplo.com',
            matricula: '2024001',
          },
          total_respostas: 3,
          respostas: [
            {
              id: 1,
              pergunta_id: 1,
              pergunta_texto: 'Qual sua renda familiar?',
              resposta_texto: 'Renda entre 1 e 3 salários mínimos',
              valor_texto: null,
              valor_opcoes: null,
              url_arquivo: null,
              data_resposta: '2024-01-15T10:00:00.000Z',
            },
          ],
        },
      },
    },
  })
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
  @ApiOkResponse({
    description: 'Respostas encontradas com sucesso',
    schema: {
      example: {
        sucesso: true,
        dados: {
          edital: {
            id: 1,
            titulo: 'Edital de Bolsa 2024',
            descricao: 'Edital para bolsas de estudo',
            status: 'Aberto',
          },
          pergunta: {
            id: 1,
            texto: 'Qual sua renda familiar?',
            tipo: 'select',
            obrigatoriedade: true,
          },
          total_respostas: 10,
          respostas: [
            {
              id: 1,
              aluno: {
                aluno_id: 1,
                nome: 'João Silva',
                email: 'joao@exemplo.com',
                matricula: '2024001',
              },
              resposta_texto: 'Renda entre 1 e 3 salários mínimos',
              valor_texto: null,
              valor_opcoes: null,
              url_arquivo: null,
              data_resposta: '2024-01-15T10:00:00.000Z',
            },
          ],
        },
      },
    },
  })
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
  @ApiBody({
    type: ValidateRespostaDto,
    description: 'Dados para validação da resposta',
    examples: {
      exemplo1: {
        summary: 'Validação sem data de validade',
        value: {
          validada: true,
        },
      },
      exemplo2: {
        summary: 'Validação com data de validade',
        value: {
          validada: true,
          dataValidade: '2024-12-31T23:59:59.000Z',
        },
      },
    },
  })
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
