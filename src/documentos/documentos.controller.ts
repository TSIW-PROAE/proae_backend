import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import AuthenticatedRequest from '../types/authenticated-request.interface';
import { DocumentoService } from './documentos.service';
import { CreateDocumentoDto } from './dto/create-documento.dto';
import { ResubmitDocumentoDto } from './dto/resubmit-documento.dto';
import { UpdateDocumentoDto } from './dto/update-documento.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('documentos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class DocumentoController {
  constructor(private readonly documentoService: DocumentoService) {}

  @Post()
  async create(@Body() createDocumentoDto: CreateDocumentoDto) {
    return await this.documentoService.createDocumento(createDocumentoDto);
  }

  @Get('/inscricao/:inscricaoId')
  async findAllByInscricao(
    @Param('inscricaoId', ParseIntPipe) inscricaoId: number,
  ) {
    return await this.documentoService.findAllDocumentoByInscricao(inscricaoId);
  }

  @Get(':id')
  async findOneDocumento(@Param('id', ParseIntPipe) id: number) {
    return await this.documentoService.findOneDocumento(id);
  }

  @Put(':id')
  async updateDocumento(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDocumentoDto: UpdateDocumentoDto,
  ) {
    return await this.documentoService.updateDocumento(id, updateDocumentoDto);
  }

  @Delete(':id')
  async removeDocumento(@Param('id', ParseIntPipe) id: number) {
    return await this.documentoService.removeDocumento(id);
  }

  @Get('reprovados/meus')
  async getMyReprovadoDocuments(@Req() request: AuthenticatedRequest) {
    const { userId } = request.user;
    return await this.documentoService.getReprovadoDocumentsByStudent(userId);
  }

  @Put('resubmissao/:id')
  async resubmitDocument(
    @Param('id', ParseIntPipe) id: number,
    @Body() resubmitDocumentoDto: ResubmitDocumentoDto,
    @Req() request: AuthenticatedRequest,
  ) {
    const { userId } = request.user;
    return await this.documentoService.resubmitDocument(
      userId,
      id,
      resubmitDocumentoDto,
    );
  }

  @Get('pendencias/meus')
  @ApiOperation({
    summary: 'Buscar documentos com problemas do aluno',
    description:
      'Retorna todos os documentos que não estão aprovados (reprovados, enviados aguardando análise, ou não enviados) do aluno autenticado, agrupados por inscrição.',
  })
  @ApiOkResponse({
    description: 'Lista de documentos com problemas encontrada com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        pendencias: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              inscricao_id: {
                type: 'number',
                example: 5,
                description: 'ID da inscrição',
              },
              titulo_edital: {
                type: 'string',
                example: 'Residências Universitárias 2024.1',
                description: 'Título do edital ao qual a inscrição pertence',
              },
              documentos: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    documento_id: {
                      type: 'number',
                      example: 2,
                      description: 'ID do documento',
                    },
                    tipo_documento: {
                      type: 'string',
                      example: 'Documento de Identidade',
                      description: 'Tipo do documento',
                    },
                    documento_url: {
                      type: 'string',
                      nullable: true,
                      example:
                        'documentos/aluno_1/inscricao_5/rg_maria_silva.pdf',
                      description: 'URL do documento enviado (null se não enviado)',
                    },
                    status_documento: {
                      type: 'string',
                      enum: ['Reprovado', 'Enviado', 'Não enviado', 'Pendente'],
                      example: 'Reprovado',
                      description: 'Status atual do documento',
                    },
                    validacoes: {
                      type: 'array',
                      description:
                        'Lista de validações realizadas no documento (vazia se não houver)',
                      items: {
                        type: 'object',
                        properties: {
                          parecer: {
                            type: 'string',
                            example:
                              'Documento ilegível. Por favor, envie uma cópia mais nítida do RG com todas as informações visíveis.',
                            description: 'Parecer do avaliador sobre o documento',
                          },
                          data_validacao: {
                            type: 'string',
                            format: 'date',
                            example: '2024-10-12',
                            description: 'Data em que o documento foi validado',
                          },
                        },
                      },
                    },
                  },
                },
                example: [
                  {
                    documento_id: 2,
                    tipo_documento: 'Documento de Identidade',
                    documento_url:
                      'documentos/aluno_1/inscricao_5/rg_maria_silva.pdf',
                    status_documento: 'Reprovado',
                    validacoes: [
                      {
                        parecer:
                          'Documento ilegível. Por favor, envie uma cópia mais nítida do RG com todas as informações visíveis.',
                        data_validacao: '2024-10-12',
                      },
                    ],
                  },
                  {
                    documento_id: 4,
                    tipo_documento: 'Comprovante de matrícula',
                    documento_url:
                      'documentos/aluno_1/inscricao_5/comprovante_matricula_maria.pdf',
                    status_documento: 'Enviado',
                    validacoes: [
                      {
                        parecer: 'Documento aguardando análise.',
                        data_validacao: '2024-10-12',
                      },
                    ],
                  },
                  {
                    documento_id: 3,
                    tipo_documento:
                      'Cert. de conclusão ou Hist. escolar do ensino médio',
                    documento_url: null,
                    status_documento: 'Não enviado',
                    validacoes: [],
                  },
                ],
              },
            },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Usuário não autenticado',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Aluno não encontrado',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'array', items: { type: 'string' }, example: ['Aluno não encontrado'] },
      },
    },
  })
  async getMyDocumentsWithProblems(@Req() request: AuthenticatedRequest) {
    const { aluno_id } = request.user;
    return await this.documentoService.getDocumentsWithProblemsByStudent(
      aluno_id,
    );
  }
}
