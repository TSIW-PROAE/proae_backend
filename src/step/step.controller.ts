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
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateStepDto } from './dto/create-step.dto';
import { UpdateStepDto } from './dto/update-step.dto';
import { AnswerStepResponseDto } from './dto/response-step.dto';
import { StepSimpleResponseDto } from './dto/step-simple-response.dto';
import { StepService } from './step.service';
import { errorExamples } from '../common/swagger/error-examples';

@ApiTags('Steps')
@Controller('steps')
export class StepController {
  constructor(private readonly stepService: StepService) {}

  @Post()
  @ApiOperation({ summary: 'Criar um novo step' })
  @ApiCreatedResponse({
    type: StepSimpleResponseDto,
    description: 'Step criado com sucesso',
  })
  @ApiNotFoundResponse({
    description: 'Edital não encontrado',
    schema: { example: errorExamples.notFound },
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno do servidor',
    schema: { example: errorExamples.internalServerError },
  })
  async create(@Body() createStepDto: CreateStepDto) {
    return this.stepService.create(createStepDto);
  }

  @Get('edital/:id/with-perguntas')
  @ApiOperation({
    summary: 'Buscar steps com perguntas de um edital específico',
  })
  @ApiOkResponse({
    type: [AnswerStepResponseDto],
    description: 'Steps com perguntas encontrados com sucesso',
  })
  @ApiNotFoundResponse({
    description: 'Nenhum step encontrado para este edital',
    schema: { example: errorExamples.notFound },
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno do servidor',
    schema: { example: errorExamples.internalServerError },
  })
  async findStepsWithPerguntasByEdital(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AnswerStepResponseDto[]> {
    return this.stepService.findStepsByEditalWithPerguntas(id);
  }

  @Get('edital/:id')
  @ApiOperation({
    summary: 'Buscar apenas steps (sem perguntas) de um edital específico',
  })
  @ApiOkResponse({
    type: [StepSimpleResponseDto],
    description: 'Steps encontrados com sucesso',
  })
  @ApiNotFoundResponse({
    description: 'Nenhum step encontrado para este edital',
    schema: { example: errorExamples.notFound },
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno do servidor',
    schema: { example: errorExamples.internalServerError },
  })
  async findStepsByEdital(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<StepSimpleResponseDto[]> {
    return this.stepService.findStepsByEdital(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar um step' })
  @ApiOkResponse({
    type: StepSimpleResponseDto,
    description: 'Step atualizado com sucesso',
  })
  @ApiNotFoundResponse({
    description: 'Step não encontrado',
    schema: { example: errorExamples.notFound },
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno do servidor',
    schema: { example: errorExamples.internalServerError },
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStepDto: UpdateStepDto,
  ) {
    return this.stepService.update(id, updateStepDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover um step' })
  @ApiOkResponse({ description: 'Step removido com sucesso' })
  @ApiNotFoundResponse({
    description: 'Step não encontrado',
    schema: { example: errorExamples.notFound },
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno do servidor',
    schema: { example: errorExamples.internalServerError },
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.stepService.remove(id);
  }
}
