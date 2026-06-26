import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AdminPerfis } from 'src/common/decorators/admin-perfis';
import { JwtAuthGuard } from 'src/presentation/http/modules/auth/guards/jwt-auth.guard';
import { AdminPerfisGuard } from 'src/presentation/http/modules/auth/guards/admin-perfis.guard';
import { RolesGuard } from 'src/presentation/http/modules/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles';
import { AdminPerfilEnum } from 'src/core/shared-kernel/enums/adminPerfil.enum';
import { RolesEnum } from 'src/core/shared-kernel/enums/enumRoles';
import {
  AlunoNaoEncontradoError,
  FindAlunoByUserIdUseCase,
} from 'src/core/application/aluno/use-cases/find-aluno-by-user-id.use-case';
import { UpdateAlunoDataUseCase } from 'src/core/application/aluno/use-cases/update-aluno-data.use-case';
import AuthenticatedRequest from 'src/core/shared-kernel/types/authenticated-request.interface';
import { AlunoService } from './aluno.service';
import { AtualizaDadosAlunoDTO } from './dto/atualizaDadosAluno';
import { CompleteCadastroAlunoDto } from './dto/complete-cadastro-aluno.dto';
import { SolicitarRecursoDto } from './dto/solicitar-recurso.dto';

@ApiTags('Alunos')
@ApiBearerAuth()
@Controller('aluno')
@UseGuards(JwtAuthGuard)
export class AlunoController {
  constructor(
    private readonly findAlunoByUserId: FindAlunoByUserIdUseCase,
    private readonly updateAlunoData: UpdateAlunoDataUseCase,
    private readonly alunoService: AlunoService,
  ) {}

  @Post('complete-cadastro')
  @ApiOperation({
    summary: 'Completar cadastro de aluno',
    description:
      'Vincula o perfil de estudante à sua conta quando você está logado mas ainda não tem cadastro de aluno (ex.: entrou como admin antes). Depois disso você pode se inscrever em editais.',
  })
  @ApiOkResponse({ description: 'Cadastro de aluno vinculado com sucesso' })
  @ApiBadRequestResponse({
    description: 'Já possui aluno ou matrícula em uso',
  })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado' })
  async completeCadastro(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CompleteCadastroAlunoDto,
  ) {
    return this.alunoService.completeCadastro(request.user.userId, dto);
  }

  @Get('me')
  @ApiOperation({
    summary: 'Buscar dados do aluno autenticado',
    description: 'Retorna os dados do aluno baseado no token JWT fornecido',
  })
  @ApiOkResponse({ description: 'Dados do aluno encontrados com sucesso' })
  @ApiNotFoundResponse({ description: 'Aluno não encontrado' })
  async findOne(@Req() request: AuthenticatedRequest) {
    const { userId, roles } = request.user;
    await this.alunoService.assertAlunoEmailConfirmadoParaPortal(
      userId,
      roles ?? [],
    );
    try {
      return await this.findAlunoByUserId.execute(userId);
    } catch (e) {
      if (e instanceof AlunoNaoEncontradoError) {
        throw new NotFoundException(e.message);
      }
      throw e;
    }
  }

  @Get('admin/por-edital/:editalId/alunos')
  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @ApiOperation({
    summary: '[Admin] Alunos com inscrição em um edital',
    description:
      'Útil na Central de estudantes: filtrar por edital e, opcionalmente, só beneficiários homologados no edital e/ou só com inscrição aprovada na análise (são critérios diferentes).',
  })
  @ApiOkResponse({ description: 'Lista retornada' })
  @ApiNotFoundResponse({ description: 'Edital não encontrado' })
  @ApiForbiddenResponse({ description: 'Apenas admins' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  async adminAlunosPorEdital(
    @Param('editalId', ParseIntPipe) editalId: number,
    @Query('apenas_beneficiarios_edital') apenasBenef?: string,
    @Query('apenas_inscricao_aprovada') apenasInsc?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.alunoService.listarAlunosComInscricaoNoEdital(editalId, {
      apenasBeneficiariosEdital:
        apenasBenef === 'true' || apenasBenef === '1',
      apenasInscricaoAprovada: apenasInsc === 'true' || apenasInsc === '1',
      page: page != null ? Number(page) : undefined,
      limit: limit != null ? Number(limit) : undefined,
    });
  }

  @Get('admin/:alunoId/resumo')
  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @ApiOperation({
    summary: '[Admin] Resumo do estudante e inscrições',
    description:
      'Dados cadastrais e linhas de inscrição (por vaga) para hub administrativo único.',
  })
  @ApiOkResponse({ description: 'Resumo retornado com sucesso' })
  @ApiNotFoundResponse({ description: 'Aluno não encontrado' })
  @ApiForbiddenResponse({ description: 'Apenas admins' })
  async adminAlunoResumo(@Param('alunoId', ParseIntPipe) alunoId: number) {
    return this.alunoService.getAdminAlunoResumo(alunoId);
  }

  @Get('all')
  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @ApiOperation({
    summary: '[Admin] Listar todos os alunos',
    description:
      'Retorna uma lista com todos os alunos cadastrados no sistema.',
  })
  @ApiOkResponse({ description: 'Lista de alunos encontrada com sucesso' })
  @ApiForbiddenResponse({ description: 'Apenas admins' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.alunoService.listarTodosAlunosPaginado(
      page != null ? Number(page) : undefined,
      limit != null ? Number(limit) : undefined,
    );
  }

  @Patch('/update')
  @ApiOperation({
    summary: 'Atualizar dados do aluno',
    description: 'Permite ao aluno atualizar seus dados pessoais',
  })
  @ApiOkResponse({ description: 'Dados do aluno atualizados com sucesso' })
  @ApiBadRequestResponse({ description: 'Dados inválidos ou email já em uso' })
  @ApiNotFoundResponse({ description: 'Aluno não encontrado' })
  async updateStudentData(
    @Req() request: AuthenticatedRequest,
    @Body() atualizaDadosAlunoDTO: AtualizaDadosAlunoDTO,
  ) {
    const { userId, roles } = request.user;
    await this.alunoService.assertAlunoEmailConfirmadoParaPortal(
      userId,
      roles ?? [],
    );
    const hasAnyData = Object.values(atualizaDadosAlunoDTO).some(
      (v) => v !== undefined && v !== null && v !== '',
    );
    if (!hasAnyData) {
      throw new BadRequestException('Dados para atualização não fornecidos.');
    }
    try {
      await this.updateAlunoData.execute(userId, {
        nome: atualizaDadosAlunoDTO.nome,
        email: atualizaDadosAlunoDTO.email,
        matricula: atualizaDadosAlunoDTO.matricula,
        dataNascimento: atualizaDadosAlunoDTO.data_nascimento,
        curso: atualizaDadosAlunoDTO.curso,
        campus: atualizaDadosAlunoDTO.campus,
        dataIngresso: atualizaDadosAlunoDTO.data_ingresso,
        celular: atualizaDadosAlunoDTO.celular,
        cpf: atualizaDadosAlunoDTO.cpf,
        nivelAcademico: atualizaDadosAlunoDTO.nivel_academico,
      });
      return { success: true, message: 'Dados do aluno atualizados com sucesso!' };
    } catch (e) {
      if (e instanceof AlunoNaoEncontradoError) {
        throw new NotFoundException(e.message);
      }
      if (e instanceof Error && e.message === 'Email já está em uso.') {
        throw new BadRequestException(e.message);
      }
      if (e instanceof Error && e.message === 'CPF já cadastrado.') {
        throw new BadRequestException(e.message);
      }
      if (
        e instanceof Error &&
        e.message === 'Matrícula já está vinculada a outro estudante.'
      ) {
        throw new BadRequestException(e.message);
      }
      throw e;
    }
  }

  @Get('/inscricoes')
  @ApiOperation({
    summary: 'Buscar inscrições do aluno',
    description: 'Retorna todas as inscrições do aluno autenticado',
  })
  @ApiOkResponse({ description: 'Inscrições do aluno encontradas com sucesso' })
  @ApiNotFoundResponse({ description: 'Aluno não encontrado' })
  async getStudentRegistration(@Req() request: AuthenticatedRequest) {
    const { userId, roles } = request.user;
    await this.alunoService.assertAlunoEmailConfirmadoParaPortal(
      userId,
      roles ?? [],
    );
    return this.alunoService.getStudentRegistration(userId);
  }

  @Post('/inscricoes/:inscricaoId/recurso')
  @ApiOperation({
    summary: 'Aluno solicita recurso administrativo da inscrição',
    description:
      'Permite ao estudante abrir recurso quando houver resultado preliminar publicado.',
  })
  @ApiParam({
    name: 'inscricaoId',
    description: 'ID da inscrição',
    type: 'number',
  })
  @ApiOkResponse({ description: 'Recurso solicitado com sucesso' })
  @ApiBadRequestResponse({ description: 'Fora das regras para recurso' })
  async solicitarRecursoInscricao(
    @Req() request: AuthenticatedRequest,
    @Param('inscricaoId', ParseIntPipe) inscricaoId: number,
    @Body() dto: SolicitarRecursoDto,
  ) {
    const { userId, roles } = request.user;
    await this.alunoService.assertAlunoEmailConfirmadoParaPortal(
      userId,
      roles ?? [],
    );
    return this.alunoService.solicitarRecursoInscricao(
      userId,
      inscricaoId,
      dto.justificativa,
    );
  }

  @Get('/edital/:editalId/step/:stepId/alunos')
  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @ApiOperation({
    summary: '[Admin] Listar alunos inscritos em questionário específico',
    description:
      'Retorna todos os alunos que responderam um questionário específico de um edital.',
  })
  @ApiParam({ name: 'editalId', description: 'ID do edital', type: 'number', example: 1 })
  @ApiParam({ name: 'stepId', description: 'ID do step/questionário', type: 'number', example: 1 })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({
    name: 'busca',
    required: false,
    description: 'Busca por nome, e-mail, matrícula ou campus',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description:
      'Filtro opcional de status (aprovada, rejeitada, pendente, ajuste_necessario).',
  })
  @ApiOkResponse({ description: 'Lista de alunos inscritos no questionário encontrada com sucesso' })
  @ApiNotFoundResponse({ description: 'Edital ou step não encontrado' })
  @ApiBadRequestResponse({ description: 'Parâmetros inválidos' })
  @ApiForbiddenResponse({ description: 'Apenas admins' })
  async findAlunosInscritosEmStep(
    @Param('editalId', ParseIntPipe) editalId: number,
    @Param('stepId', ParseIntPipe) stepId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('busca') busca?: string,
    @Query('status') status?: string,
  ) {
    return this.alunoService.findAlunosInscritosEmStep(editalId, stepId, {
      page: page != null ? Number(page) : undefined,
      limit: limit != null ? Number(limit) : undefined,
      busca,
      status,
    });
  }

  @Delete('admin/:alunoId/perfil')
  @UseGuards(RolesGuard, AdminPerfisGuard)
  @Roles(RolesEnum.ADMIN)
  @AdminPerfis(AdminPerfilEnum.GERENCIAL)
  @ApiOperation({
    summary: '[Gerencial] Excluir perfil de aluno',
    description:
      'Remove o perfil de estudante (role aluno + vínculo aluno) quando não houver inscrições vinculadas.',
  })
  @ApiParam({ name: 'alunoId', type: 'number' })
  @ApiOkResponse({ description: 'Perfil de aluno removido' })
  @ApiForbiddenResponse({ description: 'Apenas perfil gerencial' })
  @ApiNotFoundResponse({ description: 'Aluno não encontrado' })
  @ApiBadRequestResponse({
    description: 'Não permitido remover o próprio perfil ou aluno com inscrições',
  })
  async excluirPerfilAluno(
    @Req() request: AuthenticatedRequest,
    @Param('alunoId', ParseIntPipe) alunoId: number,
  ) {
    return this.alunoService.removeAlunoPerfilByGerencial(
      request.user.userId,
      alunoId,
    );
  }
}
