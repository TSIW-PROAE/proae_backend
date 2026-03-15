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
import { GetInscricoesComPendenciasUseCase } from 'src/core/application/inscricao/use-cases/get-inscricoes-com-pendencias.use-case';
import { UpdateInscricaoUseCase } from 'src/core/application/inscricao/use-cases/update-inscricao.use-case';
import type { PdfRendererPort } from 'src/core/application/utilities/ports/pdf-renderer.port';
import { PDF_RENDERER } from 'src/core/application/utilities/utility.tokens';
import AuthenticatedRequest from 'src/core/shared-kernel/types/authenticated-request.interface';
import { errorExamples } from 'src/common/swagger/error-examples';
import { JwtAuthGuard } from 'src/presentation/http/modules/auth/guards/jwt-auth.guard';
import { CreateInscricaoDto } from './dto/create-inscricao-dto';
import { InscricaoResponseDto } from './dto/response-inscricao.dto';
import { UpdateInscricaoDto } from './dto/update-inscricao-dto';
import { InscricaoService } from './inscricao.service';

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
      e.message.includes('já possui uma inscrição')
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
    private readonly updateInscricaoUseCase: UpdateInscricaoUseCase,
    private readonly inscricaoService: InscricaoService,
    @Inject(PDF_RENDERER)
    private readonly pdfService: PdfRendererPort,
  ) {}

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
  @ApiOperation({
    summary: 'Gerar PDF com todos os estudantes aprovados',
  })
  @ApiQuery({
    name: 'editalId',
    required: false,
    type: Number,
    description: 'ID do edital para filtrar os aprovados (opcional)',
  })
  async generateAprovadosPdf(
    @Res() res: Response,
    @Query('editalId') editalIdStr?: string,
  ) {
    const editalId = editalIdStr ? parseInt(editalIdStr, 10) : undefined;
    const pdfBuffer = await this.pdfService.generateAprovadosPdf(editalId);

    const filename = editalId
      ? `estudantes-aprovados-edital-${editalId}.pdf`
      : `estudantes-aprovados-${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );
    res.setHeader('Content-Length', pdfBuffer.length.toString());

    return res.send(pdfBuffer);
  }
}
