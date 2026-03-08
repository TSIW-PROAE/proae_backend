import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles';
import { RolesEnum } from '../core/shared-kernel/enums/enumRoles';
import {
  CreateEditalUseCase,
  ListEditaisUseCase,
  FindEditalByIdUseCase,
  UpdateEditalUseCase,
  RemoveEditalUseCase,
  ListEditaisAbertosUseCase,
  UpdateEditalStatusUseCase,
  GetAlunosInscritosUseCase,
  EditalNaoEncontradoError,
  StatusEditalInvalidoError,
} from '../core/application/edital';

@ApiTags('Editais')
@Controller('editais')
export class EditalController {
  constructor(
    private readonly createEdital: CreateEditalUseCase,
    private readonly listEditais: ListEditaisUseCase,
    private readonly findEditalById: FindEditalByIdUseCase,
    private readonly updateEdital: UpdateEditalUseCase,
    private readonly removeEdital: RemoveEditalUseCase,
    private readonly listEditaisAbertos: ListEditaisAbertosUseCase,
    private readonly updateEditalStatus: UpdateEditalStatusUseCase,
    private readonly getAlunosInscritosUseCase: GetAlunosInscritosUseCase,
  ) {}

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
    return this.createEdital.execute({
      titulo_edital: createEditalDto.titulo_edital,
    });
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
    return this.listEditais.execute();
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
    return this.listEditaisAbertos.execute();
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
    try {
      return await this.findEditalById.execute(+id);
    } catch (e) {
      if (e instanceof EditalNaoEncontradoError) {
        throw new NotFoundException(e.message);
      }
      throw e;
    }
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
    try {
      return await this.updateEdital.execute(+id, {
        titulo_edital: updateEditalDto.titulo_edital,
        descricao: updateEditalDto.descricao,
        edital_url: updateEditalDto.edital_url,
        etapa_edital: updateEditalDto.etapa_edital,
      });
    } catch (e) {
      if (e instanceof EditalNaoEncontradoError) {
        throw new NotFoundException(e.message);
      }
      throw e;
    }
  }

  @Get(':id/inscritos')
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'Lista de alunos inscritos no edital retornada com sucesso',
  })
  @ApiUnauthorizedResponse({
    description: 'Não autorizado',
    schema: { example: errorExamples.unauthorized },
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno do servidor',
    schema: { example: errorExamples.internalServerError },
  })
  @ApiNotFoundResponse({ description: 'Edital não encontrado' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolesEnum.ADMIN)
  async getAlunosInscritos(
    @Param('id') id: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    try {
      return await this.getAlunosInscritosUseCase.execute(
        +id,
        limit ?? 20,
        offset ?? 0,
      );
    } catch (e) {
      if (e instanceof EditalNaoEncontradoError) {
        throw new NotFoundException(e.message);
      }
      throw e;
    }
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
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno do servidor',
    schema: { example: errorExamples.internalServerError },
  })
  async updateStatus(
    @Param('id') id: string,
    @Param('status') status: 'RASCUNHO' | 'ABERTO' | 'ENCERRADO' | 'EM_ANDAMENTO',
  ) {
    try {
      return await this.updateEditalStatus.execute(+id, status);
    } catch (e) {
      if (e instanceof EditalNaoEncontradoError) {
        throw new NotFoundException(e.message);
      }
      if (e instanceof StatusEditalInvalidoError) {
        throw new BadRequestException(e.message);
      }
      throw e;
    }
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Edital removido com sucesso' })
  @ApiNotFoundResponse({
    description: 'Edital não encontrado',
    schema: { example: errorExamples.notFound },
  })
  @ApiBadRequestResponse({
    description: 'Edital possui inscrições vinculadas',
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno do servidor',
    schema: { example: errorExamples.internalServerError },
  })
  async remove(@Param('id') id: string) {
    try {
      return await this.removeEdital.execute(+id);
    } catch (e) {
      if (e instanceof EditalNaoEncontradoError) {
        throw new NotFoundException(e.message);
      }
      if (
        e instanceof Error &&
        e.message.includes('inscrições vinculadas')
      ) {
        throw new BadRequestException(e.message);
      }
      throw e;
    }
  }
}
