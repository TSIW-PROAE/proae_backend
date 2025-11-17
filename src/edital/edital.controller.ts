import {
  Body,
  Controller,
  Delete,
  Get,
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
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { errorExamples } from '../common/swagger/error-examples';
import { CreateEditalDto } from './dto/create-edital.dto';
import { EditalResponseDto } from './dto/edital-response.dto';
import { UpdateEditalDto } from './dto/update-edital.dto';
import { EditalService } from './edital.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles';
import { RolesEnum } from '../enum/enumRoles';

@ApiTags('Editais')
@Controller('editais')
export class EditalController {
  constructor(private readonly editalService: EditalService) {}

  @Post()
  @ApiCreatedResponse({
    type: EditalResponseDto,
    description: 'Edital criado com sucesso',
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno do servidor',
    schema: { example: errorExamples.internalServerError },
  })
  async create(@Body() createEditalDto: CreateEditalDto) {
    return this.editalService.create(createEditalDto);
  }

  @Get()
  @ApiOkResponse({
    type: [EditalResponseDto],
    description: 'Lista de editais retornada com sucesso',
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno do servidor',
    schema: { example: errorExamples.internalServerError },
  })
  async findAll() {
    return this.editalService.findAll();
  }

  @Get('abertos')
  @ApiOkResponse({
    type: [EditalResponseDto],
    description: 'Lista de editais abertos retornada com sucesso',
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno do servidor',
    schema: { example: errorExamples.internalServerError },
  })
  async findOpened() {
    return this.editalService.getEditalOpedened();
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
    return this.editalService.findOne(+id);
  }

  @Patch(':id')
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
    return this.editalService.update(+id, updateEditalDto);
  }

  @Get(':id/inscritos')
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'Lista de alunos inscritos no edital retornada com sucesso',
    schema: {
      example: [
        {
          aluno_id: 1,
          matricula: '2024001001',
          curso: 'Ciência da Computação',
          campus: 'Salvador',
          data_ingresso: '2024-03-01',
          usuario: {
            usuario_id: '550e8400-e29b-41d4-a716-446655440001',
            email: 'maria.silva@ufba.br',
            nome: 'Maria Silva Santos',
            cpf: '12345678902',
            celular: '71988888888',
            lastPasswordResetRequest: null,
            passwordResetToken: null,
            passwordResetTokenExpires: null,
            data_nascimento: '2000-03-20',
            roles: 'aluno',
          },
        },
        {
          aluno_id: 2,
          matricula: '2024001002',
          curso: 'Engenharia de Software',
          campus: 'Salvador',
          data_ingresso: '2024-03-01',
          usuario: {
            usuario_id: '550e8400-e29b-41d4-a716-446655440002',
            email: 'joao.oliveira@ufba.br',
            nome: 'João Pedro Oliveira',
            cpf: '12345678903',
            celular: '71977777777',
            lastPasswordResetRequest: null,
            passwordResetToken: null,
            passwordResetTokenExpires: null,
            data_nascimento: '1999-07-10',
            roles: 'aluno',
          },
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Não autorizado',
    schema: { example: errorExamples.unauthorized },
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno do servidor',
    schema: { example: errorExamples.internalServerError },
  })
  @ApiNotFoundResponse({
    description: 'Edital não encontrado',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Número máximo de alunos a retornar',
    example: 10,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Número de alunos a pular (paginação)',
    example: 0,
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolesEnum.ADMIN)
  async getAlunosInscritos(@Param('id') id: string, @Query('limit') limit?: number, @Query('offset') offset?: number) {
    return this.editalService.getAlunosInscritos(+id, limit, offset);
  }

  @Patch(':id/status/:status')
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
    schema: { 
      example: {
        statusCode: 400,
        message: 'Para alterar o status para ABERTO ou EM_ANDAMENTO, todos os dados do edital devem estar preenchidos',
        timestamp: '2025-08-18T03:00:00.000Z'
      }
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno do servidor',
    schema: { example: errorExamples.internalServerError },
  })
  async updateStatus(
    @Param('id') id: string,
    @Param('status') status: 'RASCUNHO' | 'ABERTO' | 'ENCERRADO' | 'EM_ANDAMENTO',
  ) {
    return this.editalService.updateStatusByParam(+id, status);
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Edital removido com sucesso' })
  @ApiNotFoundResponse({
    description: 'Edital não encontrado',
    schema: { example: errorExamples.notFound },
  })
  @ApiInternalServerErrorResponse({
    description: 'Erro interno do servidor',
    schema: { example: errorExamples.internalServerError },
  })
  async remove(@Param('id') id: string) {
    return this.editalService.remove(+id);
  }
}
