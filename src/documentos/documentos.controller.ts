import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  Param,
  ParseFilePipe,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
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
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('documentos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class DocumentoController {
  constructor(private readonly documentoService: DocumentoService) {}

  @Post('upload')
  @ApiOperation({
    summary: 'Fazer upload de documento',
    description: 'Permite fazer upload de um documento associado a uma inscrição. Aceita arquivos PNG, JPEG ou PDF.'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo do documento (PNG, JPEG ou PDF)'
        },
        inscricao: {
          type: 'number',
          description: 'ID da inscrição associada ao documento'
        },
        tipo_documento: {
          type: 'string',
          description: 'Tipo do documento sendo enviado'
        }
      },
      required: ['files', 'inscricao', 'tipo_documento']
    }
  })
  @ApiOkResponse({
    description: 'Documento enviado com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: true
        },
        documento: {
          type: 'object',
          properties: {
            documento_id: {
              type: 'number',
              example: 1
            },
            tipo_documento: {
              type: 'string',
              example: 'RG'
            },
            documento_url: {
              type: 'string',
              example: 'documentos/aluno_1/inscricao_1/documento.pdf'
            },
            status_documento: {
              type: 'string',
              example: 'PENDENTE'
            }
          }
        }
      }
    }
  })
  @UseInterceptors(FilesInterceptor('files'))
  async create(@Body() createDocumentoDto: CreateDocumentoDto,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: /png|jpeg|pdf/ })],
      }),
    )
    files: Express.Multer.File[],
    @Req() request: AuthenticatedRequest,
  ) {
    return await this.documentoService.createDocumento(createDocumentoDto, files);
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
  @ApiOperation({
    summary: 'Reenviar documento reprovado',
    description:
      'Permite que o aluno reenviem um documento que foi previamente reprovado. O documento será atualizado com o novo arquivo enviado e seu status será alterado para "Enviado" para nova análise.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo do documento (PNG, JPEG ou PDF)'
        },
        tipo_documento: {
          type: 'string',
          description: 'Tipo do documento sendo enviado'
        }
      },
      required: ['files', 'tipo_documento']
    }
  })
  @UseInterceptors(FilesInterceptor('files'))
  async resubmitDocument(
    @Param('id', ParseIntPipe) id: number,
    @Body() resubmitDocumentoDto: ResubmitDocumentoDto,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: /png|jpeg|pdf/ })],
      }),
    )
    files: Express.Multer.File[],
    @Req() request: AuthenticatedRequest,
  ) {
    const { userId } = request.user;
    return await this.documentoService.resubmitDocument(
      userId,
      id,
      resubmitDocumentoDto,
      files,
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
                    status_documento: 'Em Análise',
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
    const { userId } = request.user;
    return await this.documentoService.getDocumentsWithProblemsByStudent(
      userId,
    );
  }
}
