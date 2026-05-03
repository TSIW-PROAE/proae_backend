import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
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
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/presentation/http/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/presentation/http/modules/auth/guards/roles.guard';
import { AdminPerfisGuard } from 'src/presentation/http/modules/auth/guards/admin-perfis.guard';
import { AdminPerfis } from 'src/common/decorators/admin-perfis';
import { AdminPerfilEnum } from 'src/core/shared-kernel/enums/adminPerfil.enum';
import { CreateEditalUseCase } from 'src/core/application/edital/use-cases/create-edital.use-case';
import {
  EditalNaoEncontradoError,
  FindEditalByIdUseCase,
} from 'src/core/application/edital/use-cases/find-edital-by-id.use-case';
import { GetAlunosInscritosUseCase } from 'src/core/application/edital/use-cases/get-alunos-inscritos.use-case';
import { ListEditaisAbertosUseCase } from 'src/core/application/edital/use-cases/list-editais-abertos.use-case';
import { ListEditaisUseCase } from 'src/core/application/edital/use-cases/list-editais.use-case';
import { RemoveEditalUseCase } from 'src/core/application/edital/use-cases/remove-edital.use-case';
import {
  StatusEditalInvalidoError,
  UpdateEditalStatusUseCase,
} from 'src/core/application/edital/use-cases/update-edital-status.use-case';
import { UpdateEditalUseCase } from 'src/core/application/edital/use-cases/update-edital.use-case';
import { RolesEnum } from 'src/core/shared-kernel/enums/enumRoles';
import { Roles } from 'src/common/decorators/roles';
import { errorExamples } from 'src/common/swagger/error-examples';
import { CreateEditalDto } from './dto/create-edital.dto';
import { EditalResponseDto } from './dto/edital-response.dto';
import { UpdateEditalDto } from './dto/update-edital.dto';
import { resolveNivelAcademicoQuery } from 'src/presentation/http/common/resolve-nivel-academico-query';

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
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, AdminPerfisGuard)
  @Roles(RolesEnum.ADMIN)
  @AdminPerfis(AdminPerfilEnum.GERENCIAL)
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
      nivel_academico: createEditalDto.nivel_academico,
    });
  }

  @Get()
  @ApiQuery({
    name: 'nivel_academico',
    required: false,
    description:
      'Filtra por Graduação ou Pós-graduação. Omitir para listar todos os níveis.',
  })
  @ApiOkResponse({
    type: [EditalResponseDto],
    description: 'Lista de editais retornada com sucesso',
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno do servidor',
    schema: { example: errorExamples.internalServerError },
  })
  async findAll(@Query('nivel_academico') nivel?: string) {
    return this.listEditais.execute(
      nivel != null && String(nivel).trim() !== '' ? nivel.trim() : undefined,
    );
  }

  @Get('abertos')
  @ApiQuery({
    name: 'nivel_academico',
    required: false,
    description:
      'Graduação (padrão) ou Pós-graduação — editais abertos só desse nível (exc. formulário geral e renovação).',
  })
  @ApiOkResponse({
    type: [EditalResponseDto],
    description: 'Lista de editais abertos retornada com sucesso',
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno do servidor',
    schema: { example: errorExamples.internalServerError },
  })
  async findOpened(@Query('nivel_academico') nivel?: string) {
    const resolved = resolveNivelAcademicoQuery(nivel);
    return this.listEditaisAbertos.execute(resolved);
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
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, AdminPerfisGuard)
  @Roles(RolesEnum.ADMIN)
  @AdminPerfis(AdminPerfilEnum.GERENCIAL)
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
        nivel_academico: updateEditalDto.nivel_academico,
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
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, AdminPerfisGuard)
  @Roles(RolesEnum.ADMIN)
  @AdminPerfis(AdminPerfilEnum.GERENCIAL)
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
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, AdminPerfisGuard)
  @Roles(RolesEnum.ADMIN)
  @AdminPerfis(AdminPerfilEnum.GERENCIAL)
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
