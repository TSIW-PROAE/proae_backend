import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import AuthenticatedRequest from 'src/types/authenticated-request.interface';
import { errorExamples } from '../common/swagger/error-examples';
import { CreateInscricaoDto } from './dto/create-inscricao-dto';
import { InscricaoResponseDto } from './dto/response-inscricao.dto';
import { UpdateInscricaoDto } from './dto/update-inscricao-dto';
import { InscricaoService } from './inscricao.service';

@ApiTags('Inscrições')
@ApiBearerAuth()
@Controller('inscricoes')
export class InscricaoController {
  constructor(private readonly inscricaoService: InscricaoService) {}

  @Post()
  @ApiCreatedResponse({
    type: InscricaoResponseDto,
    description: 'Inscrição criada com sucesso',
  })
  @ApiNotFoundResponse({
    description: 'Aluno ou Edital não encontrado',
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
  async createInscricao(@Body() createInscricaoDto: CreateInscricaoDto): Promise<InscricaoResponseDto> {
    return await this.inscricaoService.createInscricao(createInscricaoDto);
  }

  @Patch(':id')
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
    @Param('id') id: number,
    @Body() updateInscricaoDto: UpdateInscricaoDto,
  ) {
    return await this.inscricaoService.updateInscricao(id, updateInscricaoDto);
  }

  @Get()
  @ApiOkResponse({
    type: InscricaoResponseDto,
    description: 'Inscrição encontrada com sucesso',
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
  async getInscricoesAluno(@Req() request: AuthenticatedRequest) {
    return await this.inscricaoService.getInscricoesByAluno(request.user.id);
  }
}
