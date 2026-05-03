import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  InternalServerErrorException,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { Response } from 'express';
import { CreateInscricaoUseCase } from 'src/core/application/inscricao/use-cases/create-inscricao.use-case';
import { CorrigirRespostasInscricaoUseCase } from 'src/core/application/inscricao/use-cases/corrigir-respostas-inscricao.use-case';
import { GetInscricoesComPendenciasUseCase } from 'src/core/application/inscricao/use-cases/get-inscricoes-com-pendencias.use-case';
import { UpdateInscricaoUseCase } from 'src/core/application/inscricao/use-cases/update-inscricao.use-case';
import type { PdfRendererPort } from 'src/core/application/utilities/ports/pdf-renderer.port';
import { PDF_RENDERER } from 'src/core/application/utilities/utility.tokens';
import AuthenticatedRequest from 'src/core/shared-kernel/types/authenticated-request.interface';
import { errorExamples } from 'src/common/swagger/error-examples';
import { JwtAuthGuard } from 'src/presentation/http/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/presentation/http/modules/auth/guards/roles.guard';
import { AdminPerfisGuard } from 'src/presentation/http/modules/auth/guards/admin-perfis.guard';
import { AdminPerfis } from 'src/common/decorators/admin-perfis';
import { Roles } from 'src/common/decorators/roles';
import { RolesEnum } from 'src/core/shared-kernel/enums/enumRoles';
import { AdminPerfilEnum } from 'src/core/shared-kernel/enums/adminPerfil.enum';
import { CorrigirRespostasInscricaoDto } from './dto/corrigir-respostas-inscricao.dto';
import { CreateInscricaoDto } from './dto/create-inscricao-dto';
import { InscricaoResponseDto } from './dto/response-inscricao.dto';
import { UpdateInscricaoDto } from './dto/update-inscricao-dto';
import { UpdateAdminInscricaoStatusDto } from './dto/update-admin-inscricao-status.dto';
import { UpdateAdminInscricaoBeneficioDto } from './dto/update-admin-inscricao-beneficio.dto';
import { InscricaoService } from './inscricao.service';
import { InscricaoAuditLogService } from '../inscricao-audit/inscricao-audit-log.service';

function mapInscricaoError(
  e: unknown,
  fallbackMessage: string,
): never {
  if (
    e instanceof NotFoundException ||
    e instanceof BadRequestException ||
    e instanceof InternalServerErrorException
  ) {
    throw e;
  }
  if (e instanceof Error) {
    if (e.message.includes('não possui cadastro de aluno')) {
      throw new BadRequestException(e.message);
    }
    if (
      e.message.includes('não encontrado') ||
      e.message.includes('não encontrada')
    ) {
      throw new NotFoundException(e.message);
    }
    if (
      e.message.includes('não está aberto') ||
      e.message.includes('não tem permissão') ||
      e.message.includes('É necessário fornecer respostas') ||
      e.message.includes('É necessário ter o Formulário Geral') ||
      e.message.includes('não pode estar vazia') ||
      e.message.includes('deve ter pelo menos uma opção') ||
      e.message.includes('deve incluir um arquivo') ||
      e.message.includes('já possui uma inscrição') ||
      e.message.includes('PATCH /inscricoes') ||
      e.message.includes('correcao-respostas') ||
      e.message.includes('Não há respostas pendentes') ||
      e.message.includes('não estão abertas para correção')
    ) {
      throw new BadRequestException(e.message);
    }
    console.error('[Inscricao] Erro inesperado:', e.message, e.stack);
    const dbMsg = (e as any).detail || (e as any).driverError?.detail;
    if (e.message.includes('value too long')) {
      throw new BadRequestException(
        'Um dos valores enviados excede o tamanho máximo permitido. Verifique os campos e tente novamente.',
      );
    }
    throw new InternalServerErrorException(
      dbMsg ? `${fallbackMessage} (detalhe: ${dbMsg})` : fallbackMessage,
    );
  }
  console.error('[Inscricao] Erro não-Error:', e);
  throw new InternalServerErrorException(fallbackMessage);
}

function mapInscricaoCreateError(e: unknown): never {
  return mapInscricaoError(
    e,
    'Ocorreu um erro ao processar sua inscrição. Por favor, tente novamente mais tarde.',
  );
}

function mapInscricaoUpdateError(e: unknown): never {
  return mapInscricaoError(
    e,
    'Ocorreu um erro ao processar a atualização da inscrição. Por favor, tente novamente mais tarde.',
  );
}

function mapInscricaoCorrecaoError(e: unknown): never {
  return mapInscricaoError(
    e,
    'Ocorreu um erro ao enviar a correção das respostas. Por favor, tente novamente mais tarde.',
  );
}

function mapInscricaoPendenciasError(e: unknown): never {
  if (e instanceof NotFoundException) {
    throw e;
  }
  if (e instanceof Error) {
    throw new BadRequestException(e.message);
  }
  throw new BadRequestException('Falha ao buscar inscrições com pendências do aluno');
}

@ApiTags('Inscrições')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inscricoes')
export class InscricaoController {
  constructor(
    private readonly getInscricoesComPendencias: GetInscricoesComPendenciasUseCase,
    private readonly createInscricaoUseCase: CreateInscricaoUseCase,
    private readonly corrigirRespostasInscricaoUseCase: CorrigirRespostasInscricaoUseCase,
    private readonly updateInscricaoUseCase: UpdateInscricaoUseCase,
    private readonly inscricaoService: InscricaoService,
    private readonly inscricaoAuditLog: InscricaoAuditLogService,
    @Inject(PDF_RENDERER)
    private readonly pdfService: PdfRendererPort,
  ) {}

  @Get('admin/:id/status-audit')
  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @ApiOperation({
    summary: '[Admin] Histórico de alterações de status da inscrição',
  })
  @ApiOkResponse({ description: 'Lista ordenada do mais recente ao mais antigo' })
  async adminListStatusAudit(@Param('id', ParseIntPipe) id: number) {
    const rows = await this.inscricaoAuditLog.findByInscricaoId(id);
    return rows.map((r) => ({
      id: r.id,
      inscricao_id: r.inscricao_id,
      actor_usuario_id: r.actor_usuario_id,
      actor_nome: r.actor_nome ?? null,
      status_anterior: r.status_anterior,
      status_novo: r.status_novo,
      observacao: r.observacao,
      created_at: r.created_at,
    }));
  }

  @Patch('admin/:id/status')
  @UseGuards(RolesGuard, AdminPerfisGuard)
  @Roles(RolesEnum.ADMIN)
  @AdminPerfis(AdminPerfilEnum.TECNICO, AdminPerfilEnum.GERENCIAL)
  @ApiOperation({
    summary: '[Admin] Alterar status e observação de qualquer inscrição',
    description:
      'Útil no hub central: aplica a editais comuns, Formulário Geral e Renovação.',
  })
  @ApiBody({ type: UpdateAdminInscricaoStatusDto })
  @ApiOkResponse({ description: 'Status atualizado' })
  async adminUpdateInscricaoStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAdminInscricaoStatusDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.inscricaoService.adminUpdateInscricaoStatus(
      id,
      dto,
      request.user.userId,
    );
  }

  @Patch('admin/:id/beneficio-edital')
  @UseGuards(RolesGuard, AdminPerfisGuard)
  @Roles(RolesEnum.ADMIN)
  @AdminPerfis(AdminPerfilEnum.GERENCIAL)
  @ApiOperation({
    summary: '[Admin] Alterar situação de benefício no edital',
    description:
      'Define se o estudante é beneficiário no edital (vaga), ou não — independente do status de análise da inscrição. Não se aplica a Formulário Geral ou Renovação.',
  })
  @ApiBody({ type: UpdateAdminInscricaoBeneficioDto })
  @ApiOkResponse({ description: 'Situação de benefício atualizada' })
  async adminUpdateBeneficioEdital(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAdminInscricaoBeneficioDto,
  ) {
    return this.inscricaoService.adminUpdateBeneficioEdital(
      id,
      dto.status_beneficio_edital,
    );
  }

  @Post()
  @ApiOperation({ summary: 'Criar uma nova inscrição' })
  @ApiBody({ type: CreateInscricaoDto })
  @ApiCreatedResponse({
    type: InscricaoResponseDto,
    description: 'Inscrição criada com sucesso',
  })
  @ApiNotFoundResponse({
    description: 'Aluno ou Vaga não encontrada',
    schema: { example: errorExamples.notFound },
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos fornecidos',
    schema: { example: errorExamples.badRequest },
  })
  @ApiUnprocessableEntityResponse({
    description: 'Erro de validação nos dados fornecidos',
    schema: { example: errorExamples.unprocessableEntity },
  })
  @ApiUnauthorizedResponse({
    description: 'Não autorizado',
    schema: { example: errorExamples.unauthorized },
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno do servidor',
    schema: { example: errorExamples.internalServerError },
  })
  async createInscricao(
    @Body() createInscricaoDto: CreateInscricaoDto,
    @Req() request: AuthenticatedRequest,
  ) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Inscricao] POST /inscricoes: usuario_id=', request.user?.userId, 'vaga_id=', createInscricaoDto?.vaga_id);
    }
    try {
      return await this.createInscricaoUseCase.execute(
        {
          vaga_id: createInscricaoDto.vaga_id,
          respostas: (createInscricaoDto.respostas ?? []).map((r) => ({
            perguntaId: r.perguntaId,
            valorTexto: r.valorTexto,
            valorOpcoes: r.valorOpcoes,
            urlArquivo: r.urlArquivo,
          })),
        },
        request.user.userId,
      );
    } catch (e) {
      mapInscricaoCreateError(e);
    }
  }

  @Patch(':id/correcao-respostas')
  @ApiOperation({
    summary: 'Corrigir respostas pendentes (ajuste ou complemento)',
    description:
      'Atualiza apenas as respostas enviadas quando a PROAE pediu ajuste ou há nova pergunta pós-inscrição. Preferível a POST /inscricoes neste caso.',
  })
  @ApiBody({ type: CorrigirRespostasInscricaoDto })
  @ApiOkResponse({
    type: InscricaoResponseDto,
    description: 'Respostas atualizadas',
  })
  async corrigirRespostasPendentes(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CorrigirRespostasInscricaoDto,
    @Req() request: AuthenticatedRequest,
  ) {
    try {
      return await this.corrigirRespostasInscricaoUseCase.execute(
        id,
        {
          respostas: (dto.respostas ?? []).map((r) => ({
            perguntaId: r.perguntaId,
            valorTexto: r.valorTexto,
            valorOpcoes: r.valorOpcoes,
            urlArquivo: r.urlArquivo,
          })),
        },
        request.user.userId,
      );
    } catch (e) {
      mapInscricaoCorrecaoError(e);
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar uma inscrição existente' })
  @ApiBody({ type: UpdateInscricaoDto })
  @ApiOkResponse({
    type: InscricaoResponseDto,
    description: 'Inscrição atualizada com sucesso',
  })
  async updateInscricao(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateInscricaoDto: UpdateInscricaoDto,
    @Req() request: AuthenticatedRequest,
  ) {
    try {
      return await this.updateInscricaoUseCase.execute(
        id,
        {
          vaga_id: updateInscricaoDto.vaga_id,
          respostas: updateInscricaoDto.respostas?.map((r) => ({
            perguntaId: r.perguntaId,
            valorTexto: r.valorTexto,
            valorOpcoes: r.valorOpcoes,
            urlArquivo: r.urlArquivo,
          })),
          respostas_editadas: updateInscricaoDto.respostas_editadas
            ?.filter((r) => r.perguntaId !== undefined)
            .map((r) => ({
              perguntaId: r.perguntaId as number,
              valorTexto: r.valorTexto,
              valorOpcoes: r.valorOpcoes,
              urlArquivo: r.urlArquivo,
            })),
          data_inscricao: updateInscricaoDto.data_inscricao,
          status_inscricao: updateInscricaoDto.status_inscricao,
        },
        request.user.userId,
      );
    } catch (e) {
      mapInscricaoUpdateError(e);
    }
  }

  @Get()
  async getInscricoesAluno(@Req() request: AuthenticatedRequest) {
    try {
      return await this.getInscricoesComPendencias.execute(
        request.user.userId,
      );
    } catch (e) {
      mapInscricaoPendenciasError(e);
    }
  }

  @Post('cache/save/respostas')
  @ApiOperation({ summary: 'Salvar respostas do formulário no cache' })
  @ApiBody({ type: CreateInscricaoDto })
  async saveRespostasCache(
    @Body() createInscricaoDto: CreateInscricaoDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return await this.inscricaoService.saveRespostaEmCache(
      createInscricaoDto,
      parseInt(request.user.userId, 10),
    );
  }

  @Get('cache/respostas/vaga/:vagaId')
  async getRespostasCache(
    @Param('vagaId', ParseIntPipe) vagaId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return await this.inscricaoService.findRespostaEmCache(
      vagaId,
      parseInt(request.user.userId, 10),
    );
  }

  @Get('aprovados/pdf')
  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @ApiOperation({
    summary: '[Admin] PDF — inscrições aprovadas na análise',
    description:
      'Lista estudantes cuja inscrição está com status "Inscrição Aprovada" (análise documental / parecer). Opcionalmente filtre por edital.',
  })
  @ApiQuery({
    name: 'editalId',
    required: false,
    type: Number,
    description: 'ID do edital (recomendado)',
  })
  @ApiNotFoundResponse({ description: 'Nenhum registro para os filtros' })
  async generateAprovadosPdf(
    @Res() res: Response,
    @Query('editalId') editalIdStr?: string,
  ) {
    const editalId =
      editalIdStr !== undefined && editalIdStr !== ''
        ? parseInt(editalIdStr, 10)
        : undefined;
    if (editalIdStr && Number.isNaN(editalId)) {
      throw new BadRequestException('editalId inválido');
    }
    const pdfBuffer = await this.pdfService.generateAprovadosPdf(editalId);

    const filename = editalId
      ? `inscricoes-aprovadas-analise-edital-${editalId}.pdf`
      : `inscricoes-aprovadas-analise-${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );
    res.setHeader('Content-Length', pdfBuffer.length.toString());

    return res.send(pdfBuffer);
  }

  @Get('beneficiarios/pdf')
  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @ApiOperation({
    summary: '[Admin] PDF — beneficiários homologados no edital',
    description:
      'Lista estudantes com situação de benefício "Beneficiário no edital" (homologação da vaga). Requer editalId.',
  })
  @ApiQuery({
    name: 'editalId',
    required: true,
    type: Number,
    description: 'ID do edital (obrigatório)',
  })
  @ApiNotFoundResponse({ description: 'Edital ou registros não encontrados' })
  async generateBeneficiariosPdf(
    @Res() res: Response,
    @Query('editalId') editalIdStr?: string,
  ) {
    if (editalIdStr === undefined || editalIdStr === '') {
      throw new BadRequestException('Informe editalId para o relatório de beneficiários.');
    }
    const editalId = parseInt(editalIdStr, 10);
    if (Number.isNaN(editalId)) {
      throw new BadRequestException('editalId inválido');
    }
    const pdfBuffer = await this.pdfService.generateBeneficiariosPdf(editalId);
    const filename = `beneficiarios-edital-${editalId}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );
    res.setHeader('Content-Length', pdfBuffer.length.toString());

    return res.send(pdfBuffer);
  }
}
