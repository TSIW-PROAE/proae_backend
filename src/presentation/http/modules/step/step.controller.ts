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
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { errorExamples } from 'src/common/swagger/error-examples';
import { AdminPerfis } from 'src/common/decorators/admin-perfis';
import { Roles } from 'src/common/decorators/roles';
import { AdminPerfilEnum } from 'src/core/shared-kernel/enums/adminPerfil.enum';
import { RolesEnum } from 'src/core/shared-kernel/enums/enumRoles';
import { JwtAuthGuard } from 'src/presentation/http/modules/auth/guards/jwt-auth.guard';
import { AdminPerfisGuard } from 'src/presentation/http/modules/auth/guards/admin-perfis.guard';
import { RolesGuard } from 'src/presentation/http/modules/auth/guards/roles.guard';
import { CloneFormularioDto, CloneFormularioResponseDto } from './dto/clone-formulario.dto';
import { CreateStepDto } from './dto/create-step.dto';
import { ReorderStepsDto } from './dto/reorder-steps.dto';
import { AnswerStepResponseDto } from './dto/response-step.dto';
import { StepSimpleResponseDto } from './dto/step-simple-response.dto';
import { UpdateStepDto } from './dto/update-step.dto';
import { StepService } from './step.service';

@ApiTags('Steps')
@Controller('steps')
export class StepController {
  constructor(private readonly stepService: StepService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, AdminPerfisGuard)
  @Roles(RolesEnum.ADMIN)
  @AdminPerfis(AdminPerfilEnum.GERENCIAL)
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

  @Post('edital/:id/clonar-formulario')
  @UseGuards(JwtAuthGuard, RolesGuard, AdminPerfisGuard)
  @Roles(RolesEnum.ADMIN)
  @AdminPerfis(AdminPerfilEnum.GERENCIAL)
  @ApiOperation({
    summary:
      'Clonar formulário (steps + perguntas) de outro edital para este edital',
  })
  @ApiCreatedResponse({
    type: CloneFormularioResponseDto,
    description: 'Formulário clonado com sucesso',
  })
  async cloneFormulario(
    @Param('id', ParseIntPipe) editalAlvoId: number,
    @Body() dto: CloneFormularioDto,
  ): Promise<CloneFormularioResponseDto> {
    return this.stepService.cloneFormulario(
      editalAlvoId,
      dto.edital_origem_id,
      dto.substituir_existente ?? false,
    );
  }

  @Patch('edital/:id/reordenar')
  @UseGuards(JwtAuthGuard, RolesGuard, AdminPerfisGuard)
  @Roles(RolesEnum.ADMIN)
  @AdminPerfis(AdminPerfilEnum.GERENCIAL)
  @ApiOperation({
    summary: 'Reordenar steps de um edital (sem excluir/recriar registros)',
  })
  @ApiOkResponse({
    description: 'Steps reordenados com sucesso',
    schema: { example: { message: 'Steps reordenados com sucesso' } },
  })
  async reorderByEdital(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReorderStepsDto,
  ) {
    return this.stepService.reorderByEdital(id, dto);
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
  @UseGuards(JwtAuthGuard, RolesGuard, AdminPerfisGuard)
  @Roles(RolesEnum.ADMIN)
  @AdminPerfis(AdminPerfilEnum.GERENCIAL)
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
  @UseGuards(JwtAuthGuard, RolesGuard, AdminPerfisGuard)
  @Roles(RolesEnum.ADMIN)
  @AdminPerfis(AdminPerfilEnum.GERENCIAL)
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
