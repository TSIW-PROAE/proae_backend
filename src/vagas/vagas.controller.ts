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
import { CreateVagaDto } from './dto/create-vaga.dto';
import { UpdateVagaDto } from './dto/update-vaga.dto';
import { VagaResponseDto } from './dto/vaga-response.dto';
import { VagasService } from './vagas.service';
import { errorExamples } from '../common/swagger/error-examples';

@ApiTags('Vagas')
@Controller('vagas')
export class VagasController {
  constructor(private readonly vagasService: VagasService) {}

  @Post()
  @ApiOperation({ summary: 'Criar uma nova vaga' })
  @ApiCreatedResponse({
    type: VagaResponseDto,
    description: 'Vaga criada com sucesso',
  })
  @ApiNotFoundResponse({
    description: 'Edital não encontrado',
    schema: {
      example: {
        statusCode: 404,
        message:
          'Edital com ID 999 não encontrado. Verifique se o edital existe e tente novamente.',
        timestamp: '2025-08-18T10:00:00.000Z',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno do servidor',
    schema: { example: errorExamples.internalServerError },
  })
  async create(@Body() createVagaDto: CreateVagaDto) {
    return this.vagasService.create(createVagaDto);
  }

  @Get('edital/:editalId')
  @ApiOperation({ summary: 'Buscar vagas de um edital específico' })
  @ApiOkResponse({
    type: [VagaResponseDto],
    description: 'Vagas encontradas com sucesso',
  })
  @ApiNotFoundResponse({
    description: 'Nenhuma vaga encontrada para este edital',
    schema: {
      example: {
        statusCode: 404,
        message:
          'Nenhuma vaga encontrada para o edital com ID 999. Verifique se o edital existe e possui vagas cadastradas.',
        timestamp: '2025-08-18T10:00:00.000Z',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno do servidor',
    schema: { example: errorExamples.internalServerError },
  })
  async findByEdital(
    @Param('editalId', ParseIntPipe) editalId: number,
  ): Promise<VagaResponseDto[]> {
    return this.vagasService.findByEdital(editalId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar uma vaga (não pode alterar edital_id)' })
  @ApiOkResponse({
    type: VagaResponseDto,
    description: 'Vaga atualizada com sucesso',
  })
  @ApiNotFoundResponse({
    description: 'Vaga não encontrada',
    schema: {
      example: {
        statusCode: 404,
        message: 'Vaga com ID 999 não encontrada.',
        timestamp: '2025-08-18T10:00:00.000Z',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno do servidor',
    schema: { example: errorExamples.internalServerError },
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateVagaDto: UpdateVagaDto,
  ) {
    return this.vagasService.update(id, updateVagaDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover uma vaga' })
  @ApiOkResponse({ description: 'Vaga removida com sucesso' })
  @ApiNotFoundResponse({
    description: 'Vaga não encontrada',
    schema: {
      example: {
        statusCode: 404,
        message: 'Vaga com ID 999 não encontrada.',
        timestamp: '2025-08-18T10:00:00.000Z',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno do servidor',
    schema: { example: errorExamples.internalServerError },
  })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.vagasService.remove(id);
  }
}
