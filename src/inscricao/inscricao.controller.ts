import { Controller, Post, Body, Put, Param, HttpException, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { InscricaoService } from './inscricao.service';
import { CreateInscricaoDto } from './dto/create-inscricao-dto';
import { UpdateInscricaoDto } from './dto/update-inscricao-dto';
import { InscricaoResponseDto } from './dto/response-inscricao.dto';
import { errorExamples } from '../common/swagger/error-examples';

@ApiTags('inscricoes')
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
  @ApiInternalServerErrorResponse({
    description: 'Erro interno do servidor',
    schema: { example: errorExamples.internalServerError },
  })
  async createInscricao(@Body() createInscricaoDto: CreateInscricaoDto): Promise<InscricaoResponseDto> {
    return await this.inscricaoService.createInscricao(createInscricaoDto);
  }

  @Put(':id')
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
}
