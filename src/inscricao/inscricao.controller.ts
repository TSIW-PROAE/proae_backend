import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  ParseIntPipe,
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
} from '@nestjs/swagger';
import AuthenticatedRequest from 'src/types/authenticated-request.interface';
import { errorExamples } from '../common/swagger/error-examples';
import { CreateInscricaoDto } from './dto/create-inscricao-dto';
import { InscricaoResponseDto } from './dto/response-inscricao.dto';
import { UpdateInscricaoDto } from './dto/update-inscricao-dto';
import { InscricaoService } from './inscricao.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Inscrições')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inscricoes')
export class InscricaoController {
  constructor(private readonly inscricaoService: InscricaoService) {}

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
  ): Promise<InscricaoResponseDto> {
    return await this.inscricaoService.createInscricao(
      createInscricaoDto,
      request.user.userId,
    );
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
    return await this.inscricaoService.updateInscricao(
      id,
      updateInscricaoDto,
      request.user.userId,
    );
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
    return await this.inscricaoService.getInscricoesByAluno(
      request.user.userId,
    );
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
}
