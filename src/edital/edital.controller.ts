import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { errorExamples } from '../common/swagger/error-examples';
import { CreateEditalDto } from './dto/create-edital.dto';
import { EditalResponseDto } from './dto/edital-response.dto';
import { UpdateEditalDto } from './dto/update-edital.dto';
import { EditalService } from './edital.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles';
import { RolesEnum } from '../enum/enumRoles';

@ApiTags('Editais')
@Controller('editais')
export class EditalController {
  constructor(private readonly editalService: EditalService) {}

  @Post()
  @ApiCreatedResponse({
    type: EditalResponseDto,
    description: 'Edital criado com sucesso',
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno do servidor',
    schema: { example: errorExamples.internalServerError },
  })
  async create(@Body() createEditalDto: CreateEditalDto) {
    return this.editalService.create(createEditalDto);
  }

  @Get()
  @ApiOkResponse({
    type: [EditalResponseDto],
    description: 'Lista de editais retornada com sucesso',
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno do servidor',
    schema: { example: errorExamples.internalServerError },
  })
  async findAll() {
    return this.editalService.findAll();
  }

  @Get('abertos')
  @ApiOkResponse({
    type: [EditalResponseDto],
    description: 'Lista de editais abertos retornada com sucesso',
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno do servidor',
    schema: { example: errorExamples.internalServerError },
  })
  async findOpened() {
    return this.editalService.getEditalOpedened();
  }

  @Get(':id')
  @ApiOkResponse({
    type: EditalResponseDto,
    description: 'Edital encontrado com sucesso',
  })
  @ApiNotFoundResponse({
    description: 'Edital não encontrado',
    schema: { example: errorExamples.notFound },
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno do servidor',
    schema: { example: errorExamples.internalServerError },
  })
  async findOne(@Param('id') id: string) {
    return this.editalService.findOne(+id);
  }

  @Patch(':id')
  @ApiOkResponse({
    type: EditalResponseDto,
    description: 'Edital atualizado com sucesso',
  })
  @ApiNotFoundResponse({
    description: 'Edital não encontrado',
    schema: { example: errorExamples.notFound },
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno do servidor',
    schema: { example: errorExamples.internalServerError },
  })
  async update(
    @Param('id') id: string,
    @Body() updateEditalDto: UpdateEditalDto,
  ) {
    return this.editalService.update(+id, updateEditalDto);
  }

  @Get(':id/inscritos')
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'Lista de alunos inscritos no edital retornada com sucesso',
    schema: {
      example: [
        {
          inscricao_id: 1,
          matricula: '2024001001',
          nome: 'Maria Silva Santos',
          email: 'maria.silva@ufba.br',
          curso: 'Ciência da Computação',
          campus: 'Salvador',
          data_inscricao: '2024-01-15',
          status_inscricao: 'Pendente',
        },
        {
          inscricao_id: 2,
          matricula: '2024001002',
          nome: 'João Pedro Oliveira',
          email: 'joao.oliveira@ufba.br',
          curso: 'Engenharia de Software',
          campus: 'Salvador',
          data_inscricao: '2024-01-16',
          status_inscricao: 'Em Análise',
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Não autorizado',
    schema: { example: errorExamples.unauthorized },
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno do servidor',
    schema: { example: errorExamples.internalServerError },
  })
  @ApiNotFoundResponse({
    description: 'Edital não encontrado',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Número máximo de alunos a retornar',
    example: 10,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Número de alunos a pular (paginação)',
    example: 0,
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolesEnum.ADMIN)
  async getAlunosInscritos(
    @Param('id') id: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.editalService.getAlunosInscritos(+id, limit, offset);
  }

  @Patch(':id/status/:status')
  @ApiOkResponse({
    type: EditalResponseDto,
    description: 'Status do edital atualizado com sucesso',
  })
  @ApiNotFoundResponse({
    description: 'Edital não encontrado',
    schema: { example: errorExamples.notFound },
  })
  @ApiBadRequestResponse({
    description: 'Transição de status inválida ou dados incompletos',
    schema: {
      example: {
        statusCode: 400,
        message:
          'Para alterar o status para ABERTO ou EM_ANDAMENTO, todos os dados do edital devem estar preenchidos',
        timestamp: '2025-08-18T03:00:00.000Z',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno do servidor',
    schema: { example: errorExamples.internalServerError },
  })
  async updateStatus(
    @Param('id') id: string,
    @Param('status')
    status: 'RASCUNHO' | 'ABERTO' | 'ENCERRADO' | 'EM_ANDAMENTO',
  ) {
    return this.editalService.updateStatusByParam(+id, status);
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Edital removido com sucesso' })
  @ApiNotFoundResponse({
    description: 'Edital não encontrado',
    schema: { example: errorExamples.notFound },
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno do servidor',
    schema: { example: errorExamples.internalServerError },
  })
  async remove(@Param('id') id: string) {
    return this.editalService.remove(+id);
  }
}
