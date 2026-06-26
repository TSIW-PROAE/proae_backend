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
import { ListEditaisVisiveisAlunoUseCase } from 'src/core/application/edital/use-cases/list-editais-visiveis-aluno.use-case';
import { ListEditaisUseCase } from 'src/core/application/edital/use-cases/list-editais.use-case';
import { RemoveEditalUseCase, EditalPossuiInscricoesError } from 'src/core/application/edital/use-cases/remove-edital.use-case';
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
    private readonly listEditaisVisiveisAluno: ListEditaisVisiveisAlunoUseCase,
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
      aplicar_template_cadastro:
        createEditalDto.aplicar_template_cadastro ?? false,
      is_formulario_renovacao:
        createEditalDto.is_formulario_renovacao ?? false,
      is_cadastro_geral: createEditalDto.is_cadastro_geral ?? false,
      inscricoes_abertas: createEditalDto.inscricoes_abertas ?? false,
      ajustes_abertos: createEditalDto.ajustes_abertos ?? false,
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
      'Graduação (padrão) ou Pós-graduação — editais abertos desse nível.',
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

  @Get('visiveis-aluno')
  @ApiQuery({
    name: 'nivel_academico',
    required: false,
    description:
      'Graduação (padrão) ou Pós-graduação. Lista os editais visíveis no portal do aluno: ABERTO + EM_ANDAMENTO + ENCERRADO.',
  })
  @ApiOkResponse({
    type: [EditalResponseDto],
    description:
      'Lista de editais visíveis para o estudante (inclui em andamento e encerrados, para acompanhamento).',
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno do servidor',
    schema: { example: errorExamples.internalServerError },
  })
  async findVisiveisAluno(@Query('nivel_academico') nivel?: string) {
    const resolved = resolveNivelAcademicoQuery(nivel);
    return this.listEditaisVisiveisAluno.execute(resolved);
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
      // `data_fim_vigencia` precisa de tratamento tri-estado:
      //  - chave ausente / undefined → preserva o valor atual.
      //  - null                      → limpa o campo no banco.
      //  - string YYYY-MM-DD         → atualiza para a nova data.
      // Por isso só incluímos a chave no payload se ela veio no body.
      const update: Parameters<typeof this.updateEdital.execute>[1] = {
        titulo_edital: updateEditalDto.titulo_edital,
        descricao: updateEditalDto.descricao,
        edital_url: updateEditalDto.edital_url,
        etapa_edital: updateEditalDto.etapa_edital,
        nivel_academico: updateEditalDto.nivel_academico,
        is_formulario_renovacao: updateEditalDto.is_formulario_renovacao,
        is_cadastro_geral: updateEditalDto.is_cadastro_geral,
        inscricoes_abertas: updateEditalDto.inscricoes_abertas,
        ajustes_abertos: updateEditalDto.ajustes_abertos,
      };
      if (
        Object.prototype.hasOwnProperty.call(
          updateEditalDto,
          'data_fim_vigencia',
        )
      ) {
        update.data_fim_vigencia = updateEditalDto.data_fim_vigencia ?? null;
      }
      return await this.updateEdital.execute(+id, update);
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
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({
    name: 'busca',
    required: false,
    description: 'Busca por nome, e-mail, CPF ou matrícula',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description:
      'Filtro opcional de status (aprovada, rejeitada, pendente, ajuste_necessario).',
  })
  @ApiQuery({
    name: 'situacao_solicitacao',
    required: false,
    description:
      'Filtro opcional de situação operacional (SELECIONADA, CLASSIFICADA, INDEFERIDA, DESISTENTE).',
  })
  @ApiQuery({
    name: 'ordenacao',
    required: false,
    description: 'data_desc (padrão), data_asc, pontuacao_desc, pontuacao_asc',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolesEnum.ADMIN)
  async getAlunosInscritos(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('busca') busca?: string,
    @Query('status') status?: string,
    @Query('situacao_solicitacao') situacaoSolicitacao?: string,
    @Query('ordenacao') ordenacao?: string,
  ) {
    try {
      return await this.getAlunosInscritosUseCase.execute(+id, {
        page: page != null ? Number(page) : undefined,
        limit: limit != null ? Number(limit) : undefined,
        busca,
        status,
        situacao_solicitacao: situacaoSolicitacao,
        ordenacao,
      });
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
        e instanceof EditalPossuiInscricoesError ||
        (e instanceof Error && e.message.includes('inscrições vinculadas'))
      ) {
        throw new BadRequestException(
          e instanceof Error
            ? e.message
            : 'Não é possível excluir o edital pois existem inscrições vinculadas às vagas',
        );
      }
      throw e;
    }
  }
}
