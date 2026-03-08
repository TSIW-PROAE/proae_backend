import {
  BadRequestException,
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  ParseIntPipe,
  Res,
  Query,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';
import AuthenticatedRequest from 'src/core/shared-kernel/types/authenticated-request.interface';
import { errorExamples } from '../common/swagger/error-examples';
import { CreateInscricaoDto } from './dto/create-inscricao-dto';
import { InscricaoResponseDto } from './dto/response-inscricao.dto';
import { UpdateInscricaoDto } from './dto/update-inscricao-dto';
import { InscricaoService } from './inscricao.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  GetInscricoesComPendenciasUseCase,
  CreateInscricaoUseCase,
  UpdateInscricaoUseCase,
} from '../core/application/inscricao';
import {
  PDF_RENDERER,
  type PdfRendererPort,
} from '../core/application/utilities';

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
      e.message.includes('não pode estar vazia') ||
      e.message.includes('deve ter pelo menos uma opção') ||
      e.message.includes('deve incluir um arquivo')
    ) {
      throw new BadRequestException(e.message);
    }
    throw new InternalServerErrorException(fallbackMessage);
  }
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
  @ApiNotFoundResponse({
    description: 'Inscrição não encontrada',
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
  @ApiOperation({ summary: 'Buscar inscrições do aluno com pendências' })
  @ApiOkResponse({
    description: 'Inscrições encontradas com sucesso',
    schema: {
      example: [
        {
          titulo_edital: 'Edital de Auxílio Alimentação 2024',
          tipo_edital: ['Auxílio Alimentação'],
          documentos: [
            {
              tipo_documento: 'Comprovante de Renda',
              status_documento: 'Pendente',
              documento_url: 'https://example.com/documento.pdf',
              parecer: null,
              data_validacao: null,
            },
          ],
        },
      ],
    },
  })
  @ApiNotFoundResponse({
    description: 'Aluno não encontrado',
    schema: { example: errorExamples.notFound },
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos fornecidos',
    schema: { example: errorExamples.badRequest },
  })
  @ApiUnauthorizedResponse({
    description: 'Não autorizado',
    schema: { example: errorExamples.unauthorized },
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno do servidor',
    schema: { example: errorExamples.internalServerError },
  })
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
  @ApiOperation({ summary: 'Buscar respostas do formulário no cache' })
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
    description:
      'Gera um PDF contendo a lista de todos os estudantes com inscrições aprovadas. Opcionalmente pode filtrar por edital específico.',
  })
  @ApiQuery({
    name: 'editalId',
    required: false,
    type: Number,
    description: 'ID do edital para filtrar os aprovados (opcional)',
  })
  @ApiOkResponse({
    description: 'PDF gerado com sucesso',
    content: {
      'application/pdf': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Nenhum estudante aprovado encontrado ou edital não encontrado',
    schema: { example: errorExamples.notFound },
  })
  @ApiUnauthorizedResponse({
    description: 'Não autorizado',
    schema: { example: errorExamples.unauthorized },
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno do servidor',
    schema: { example: errorExamples.internalServerError },
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
