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
  Query,
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
import { CreateFormularioGeralDto } from './dto/create-formulario-geral.dto';
import { UpdateFormularioGeralDto } from './dto/update-formulario-geral.dto';
import { UpdateFGInscricaoStatusDto } from './dto/update-fg-inscricao-status.dto';
import { FormularioGeralService } from './formulario-geral.service';
import { resolveNivelAcademicoQuery } from 'src/presentation/http/common/resolve-nivel-academico-query';

@ApiTags('Formulário Geral')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('formulario-geral')
export class FormularioGeralController {
  constructor(private readonly formularioGeralService: FormularioGeralService) {}

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @ApiOperation({
    summary: '[Admin] Formulário geral por nível (configuração, sem status de aluno)',
  })
  @ApiOkResponse({ description: 'Formulário geral retornado' })
  @ApiNotFoundResponse({ description: 'Não configurado para este nível' })
  async getFormularioGeralAdmin(@Query('nivel_academico') nivel?: string) {
    const n = resolveNivelAcademicoQuery(nivel);
    const r = await this.formularioGeralService.findFormularioGeralPorNivel(n);
    if (!r) {
      throw new NotFoundException(
        'Formulário geral não configurado para este nível.',
      );
    }
    return r;
  }

  @Get()
  @ApiOperation({
    summary: 'Obter formulário geral (aluno: inclui status da minha inscrição e se pode se inscrever em outros)',
  })
  @ApiOkResponse({ description: 'Formulário geral retornado com sucesso' })
  @ApiNotFoundResponse({ description: 'Formulário geral não configurado' })
  @ApiUnauthorizedResponse({ description: 'Não autorizado' })
  async getFormularioGeral(@Req() req: AuthenticatedRequest) {
    const result = await this.formularioGeralService.findFormularioGeralComMeuStatus(
      req.user.userId,
    );
    if (!result) throw new NotFoundException('Formulário geral não configurado.');
    return result;
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @ApiOperation({ summary: '[Admin] Criar formulário geral' })
  @ApiOkResponse({ description: 'Formulário geral criado com sucesso' })
  @ApiUnauthorizedResponse({ description: 'Não autorizado' })
  async create(@Body() dto: CreateFormularioGeralDto) {
    try {
      return await this.formularioGeralService.create(dto);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao criar formulário geral';
      throw new BadRequestException(msg);
    }
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @ApiOperation({ summary: '[Admin] Editar formulário geral' })
  @ApiOkResponse({ description: 'Formulário geral atualizado com sucesso' })
  @ApiNotFoundResponse({ description: 'Formulário geral não encontrado' })
  @ApiUnauthorizedResponse({ description: 'Não autorizado' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFormularioGeralDto,
  ) {
    return this.formularioGeralService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @ApiOperation({ summary: '[Admin] Desativar/excluir formulário geral' })
  @ApiOkResponse({ description: 'Formulário geral desativado com sucesso' })
  @ApiNotFoundResponse({ description: 'Formulário geral não encontrado' })
  @ApiUnauthorizedResponse({ description: 'Não autorizado' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.formularioGeralService.remove(id);
  }

  /* ── Gestão de inscrições do FG ── */

  @Get('inscricoes')
  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @ApiOperation({ summary: '[Admin] Listar inscrições do formulário geral' })
  @ApiOkResponse({ description: 'Lista de inscrições retornada com sucesso' })
  async listarInscricoes(
    @Query('nivel_academico') nivelAcademico?: string,
  ) {
    return this.formularioGeralService.listarInscricoesFG(
      resolveNivelAcademicoQuery(nivelAcademico),
    );
  }

  @Get('inscricoes/:inscricaoId')
  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @ApiOperation({ summary: '[Admin] Detalhe de uma inscrição do formulário geral' })
  @ApiOkResponse({ description: 'Detalhe retornado com sucesso' })
  @ApiNotFoundResponse({ description: 'Inscrição não encontrada' })
  async detalheInscricao(
    @Param('inscricaoId', ParseIntPipe) inscricaoId: number,
    @Query('nivel_academico') nivelAcademico?: string,
  ) {
    return this.formularioGeralService.detalheInscricaoFG(
      inscricaoId,
      resolveNivelAcademicoQuery(nivelAcademico),
    );
  }

  @Patch('inscricoes/:inscricaoId/status')
  @UseGuards(RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @ApiOperation({ summary: '[Admin] Alterar status de inscrição do FG (aprovar/negar/pedir ajustes)' })
  @ApiOkResponse({ description: 'Status atualizado com sucesso' })
  @ApiNotFoundResponse({ description: 'Inscrição não encontrada' })
  async alterarStatusInscricao(
    @Param('inscricaoId', ParseIntPipe) inscricaoId: number,
    @Body() dto: UpdateFGInscricaoStatusDto,
    @Req() req: AuthenticatedRequest,
    @Query('nivel_academico') nivelAcademico?: string,
  ) {
    return this.formularioGeralService.alterarStatusInscricaoFG(
      inscricaoId,
      dto,
      resolveNivelAcademicoQuery(nivelAcademico),
      req.user.userId,
    );
  }
}
