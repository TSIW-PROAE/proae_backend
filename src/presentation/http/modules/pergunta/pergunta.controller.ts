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
import { PerguntaResponseDto } from 'src/presentation/http/modules/step/dto/response-pergunta.dto';
import { CreatePerguntaDto } from './dto/create-pergunta.dto';
import { ReorderPerguntasDto } from './dto/reorder-perguntas.dto';
import { UpdatePerguntaDto } from './dto/update-pergunta.dto';
import { PerguntaService } from './pergunta.service';

@ApiTags('Perguntas')
@Controller('perguntas')
export class PerguntaController {
  constructor(private readonly perguntaService: PerguntaService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, AdminPerfisGuard)
  @Roles(RolesEnum.ADMIN)
  @AdminPerfis(AdminPerfilEnum.GERENCIAL)
  @ApiOperation({ summary: 'Criar uma nova pergunta' })
  @ApiCreatedResponse({
    type: PerguntaResponseDto,
    description: 'Pergunta criada com sucesso',
  })
  @ApiNotFoundResponse({
    description: 'Step não encontrado',
    schema: {
      example: {
        statusCode: 404,
        message:
          'Step com ID 999 não encontrado. Verifique se o step existe e tente novamente.',
        timestamp: '2025-08-18T10:00:00.000Z',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno do servidor',
    schema: { example: errorExamples.internalServerError },
  })
  async create(@Body() createPerguntaDto: CreatePerguntaDto) {
    return this.perguntaService.create(createPerguntaDto);
  }

  @Get('step/:stepId')
  @ApiOperation({ summary: 'Buscar perguntas de um step específico' })
  @ApiOkResponse({
    type: [PerguntaResponseDto],
    description: 'Perguntas encontradas com sucesso',
  })
  @ApiNotFoundResponse({
    description: 'Nenhuma pergunta encontrada para este step',
    schema: {
      example: {
        statusCode: 404,
        message:
          'Nenhuma pergunta encontrada para o step com ID 999. Verifique se o step existe e possui perguntas cadastradas.',
        timestamp: '2025-08-18T10:00:00.000Z',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno do servidor',
    schema: { example: errorExamples.internalServerError },
  })
  async findByStep(
    @Param('stepId', ParseIntPipe) stepId: number,
  ): Promise<PerguntaResponseDto[]> {
    return this.perguntaService.findByStep(stepId);
  }

  @Patch('step/:stepId/reordenar')
  @UseGuards(JwtAuthGuard, RolesGuard, AdminPerfisGuard)
  @Roles(RolesEnum.ADMIN)
  @AdminPerfis(AdminPerfilEnum.GERENCIAL)
  @ApiOperation({
    summary:
      'Reordenar perguntas de um step (sem excluir/recriar registros)',
  })
  @ApiOkResponse({
    description: 'Perguntas reordenadas com sucesso',
    schema: { example: { message: 'Perguntas reordenadas com sucesso' } },
  })
  async reorderByStep(
    @Param('stepId', ParseIntPipe) stepId: number,
    @Body() dto: ReorderPerguntasDto,
  ) {
    return this.perguntaService.reorderByStep(stepId, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, AdminPerfisGuard)
  @Roles(RolesEnum.ADMIN)
  @AdminPerfis(AdminPerfilEnum.GERENCIAL)
  @ApiOperation({
    summary: 'Atualizar uma pergunta (não pode alterar tipo_Pergunta nem step)',
  })
  @ApiOkResponse({
    type: PerguntaResponseDto,
    description: 'Pergunta atualizada com sucesso',
  })
  @ApiNotFoundResponse({
    description: 'Pergunta não encontrada',
    schema: { example: errorExamples.notFound },
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno do servidor',
    schema: { example: errorExamples.internalServerError },
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePerguntaDto: UpdatePerguntaDto,
  ) {
    return this.perguntaService.update(id, updatePerguntaDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, AdminPerfisGuard)
  @Roles(RolesEnum.ADMIN)
  @AdminPerfis(AdminPerfilEnum.GERENCIAL)
  @ApiOperation({ summary: 'Remover uma pergunta' })
  @ApiOkResponse({ description: 'Pergunta removida com sucesso' })
  @ApiNotFoundResponse({
    description: 'Pergunta não encontrada',
    schema: { example: errorExamples.notFound },
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno do servidor',
    schema: { example: errorExamples.internalServerError },
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.perguntaService.remove(id);
  }
}
