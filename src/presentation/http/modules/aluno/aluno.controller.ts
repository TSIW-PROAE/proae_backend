import {
  BadRequestException,
  Body,
  Controller,
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
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/presentation/http/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/presentation/http/modules/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles';
import { RolesEnum } from 'src/core/shared-kernel/enums/enumRoles';
import {
  AlunoNaoEncontradoError,
  FindAlunoByUserIdUseCase,
} from 'src/core/application/aluno/use-cases/find-aluno-by-user-id.use-case';
import {
  ListAlunosUseCase,
  NenhumAlunoEncontradoError,
} from 'src/core/application/aluno/use-cases/list-alunos.use-case';
import { UpdateAlunoDataUseCase } from 'src/core/application/aluno/use-cases/update-aluno-data.use-case';
import AuthenticatedRequest from 'src/core/shared-kernel/types/authenticated-request.interface';
import { AlunoService } from './aluno.service';
import { AtualizaDadosAlunoDTO } from './dto/atualizaDadosAluno';
import { CompleteCadastroAlunoDto } from './dto/complete-cadastro-aluno.dto';

@ApiTags('Alunos')
@ApiBearerAuth()
@Controller('aluno')
@UseGuards(JwtAuthGuard)
export class AlunoController {
  constructor(
    private readonly findAlunoByUserId: FindAlunoByUserIdUseCase,
    private readonly listAlunos: ListAlunosUseCase,
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
  async adminAlunosPorEdital(
    @Param('editalId', ParseIntPipe) editalId: number,
    @Query('apenas_beneficiarios_edital') apenasBenef?: string,
    @Query('apenas_inscricao_aprovada') apenasInsc?: string,
  ) {
    return this.alunoService.listarAlunosComInscricaoNoEdital(editalId, {
      apenasBeneficiariosEdital:
        apenasBenef === 'true' || apenasBenef === '1',
      apenasInscricaoAprovada: apenasInsc === 'true' || apenasInsc === '1',
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
  async adminAlunoResumo(@Param('alunoId', ParseIntPipe) alunoId: number) {
    return this.alunoService.getAdminAlunoResumo(alunoId);
  }

  @Get('all')
  @ApiOperation({
    summary: 'Listar todos os alunos',
    description: 'Retorna uma lista com todos os alunos cadastrados no sistema',
  })
  @ApiOkResponse({ description: 'Lista de alunos encontrada com sucesso' })
  @ApiNotFoundResponse({ description: 'Nenhum aluno encontrado' })
  async findAll() {
    try {
      return await this.listAlunos.execute();
    } catch (e) {
      if (e instanceof NenhumAlunoEncontradoError) {
        throw new NotFoundException(e.message);
      }
      throw e;
    }
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

  @Get('/edital/:editalId/step/:stepId/alunos')
  @ApiOperation({
    summary: 'Listar alunos inscritos em questionário específico',
    description: 'Retorna todos os alunos que responderam um questionário (step) específico de um edital',
  })
  @ApiParam({ name: 'editalId', description: 'ID do edital', type: 'number', example: 1 })
  @ApiParam({ name: 'stepId', description: 'ID do step/questionário', type: 'number', example: 1 })
  @ApiOkResponse({ description: 'Lista de alunos inscritos no questionário encontrada com sucesso' })
  @ApiNotFoundResponse({ description: 'Edital ou step não encontrado' })
  @ApiBadRequestResponse({ description: 'Parâmetros inválidos' })
  async findAlunosInscritosEmStep(
    @Param('editalId', ParseIntPipe) editalId: number,
    @Param('stepId', ParseIntPipe) stepId: number,
  ) {
    return this.alunoService.findAlunosInscritosEmStep(editalId, stepId);
  }
}
