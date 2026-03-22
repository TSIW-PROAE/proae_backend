import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/presentation/http/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/presentation/http/modules/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles';
import { RolesEnum } from 'src/core/shared-kernel/enums/enumRoles';
import AuthenticatedRequest from 'src/core/shared-kernel/types/authenticated-request.interface';
import { CreateFormularioGeralDto } from '../formulario-geral/dto/create-formulario-geral.dto';
import { UpdateFormularioGeralDto } from '../formulario-geral/dto/update-formulario-geral.dto';
import { UpdateFGInscricaoStatusDto } from '../formulario-geral/dto/update-fg-inscricao-status.dto';
import { FormularioRenovacaoService } from './formulario-renovacao.service';

@ApiTags('Formulário Renovação')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('formulario-renovacao')
export class FormularioRenovacaoController {
  constructor(
    private readonly formularioRenovacaoService: FormularioRenovacaoService,
  ) {}

  @Get()
  @ApiOperation({
    summary:
      'Obter formulário de renovação (aluno: status da inscrição e elegibilidade)',
  })
  @ApiOkResponse({ description: 'Formulário retornado com sucesso' })
  @ApiNotFoundResponse({ description: 'Não configurado' })
  @ApiUnauthorizedResponse({ description: 'Não autorizado' })
  async getFormularioRenovacao(@Req() req: AuthenticatedRequest) {
    const result =
      await this.formularioRenovacaoService.findFormularioRenovacaoComMeuStatus(
        req.user.userId,
      );
    if (!result) {
      throw new NotFoundException('Formulário de renovação não configurado.');
    }
    return result;
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @ApiOperation({ summary: '[Admin] Criar formulário de renovação' })
  async create(@Body() dto: CreateFormularioGeralDto) {
    try {
      return await this.formularioRenovacaoService.create(dto);
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : 'Erro ao criar formulário de renovação';
      throw new BadRequestException(msg);
    }
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @ApiOperation({ summary: '[Admin] Editar formulário de renovação' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFormularioGeralDto,
  ) {
    return this.formularioRenovacaoService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @ApiOperation({ summary: '[Admin] Desativar formulário de renovação' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.formularioRenovacaoService.remove(id);
  }

  @Get('inscricoes')
  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @ApiOperation({ summary: '[Admin] Listar inscrições do formulário de renovação' })
  async listarInscricoes() {
    return this.formularioRenovacaoService.listarInscricoesFR();
  }

  @Get('inscricoes/:inscricaoId')
  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @ApiOperation({ summary: '[Admin] Detalhe de inscrição (renovação)' })
  async detalheInscricao(
    @Param('inscricaoId', ParseIntPipe) inscricaoId: number,
  ) {
    return this.formularioRenovacaoService.detalheInscricaoFR(inscricaoId);
  }

  @Patch('inscricoes/:inscricaoId/status')
  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @ApiOperation({ summary: '[Admin] Alterar status da inscrição (renovação)' })
  async alterarStatusInscricao(
    @Param('inscricaoId', ParseIntPipe) inscricaoId: number,
    @Body() dto: UpdateFGInscricaoStatusDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.formularioRenovacaoService.alterarStatusInscricaoFR(
      inscricaoId,
      dto,
      req.user.userId,
    );
  }
}
