import {
  Body,
  Controller,
  Delete,
  Get,
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
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles';
import { AdminPerfis } from 'src/common/decorators/admin-perfis';
import { RolesEnum } from 'src/core/shared-kernel/enums/enumRoles';
import { AdminPerfilEnum } from 'src/core/shared-kernel/enums/adminPerfil.enum';
import AuthenticatedRequest from 'src/core/shared-kernel/types/authenticated-request.interface';
import { JwtAuthGuard } from 'src/presentation/http/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/presentation/http/modules/auth/guards/roles.guard';
import { AdminPerfisGuard } from 'src/presentation/http/modules/auth/guards/admin-perfis.guard';
import { AdminService } from './admin.service';
import { AtualizaAdminDto } from './dto/atualiza-admin.dto';
import { AtualizaAdminPerfilDto } from './dto/atualiza-admin-perfil.dto';
import { AprovarAdminDto } from './dto/aprovar-admin.dto';
import { AdicionarAdminNotificacaoEmailDto } from './dto/admin-notificacao-email.dto';

@ApiTags('Admin (servidor PROAE)')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RolesEnum.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @ApiOperation({
    summary: 'Perfil do servidor PROAE autenticado',
    description:
      'Retorna nome, email, cargo e demais dados para a tela de configurações.',
  })
  @ApiOkResponse({ description: 'Perfil encontrado' })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado' })
  @ApiForbiddenResponse({ description: 'Sem papel de admin' })
  async getMe(@Req() request: AuthenticatedRequest) {
    return this.adminService.getMe(request.user.userId);
  }

  @Patch('update')
  @ApiOperation({ summary: 'Atualizar dados do servidor PROAE' })
  @ApiOkResponse({ description: 'Dados atualizados' })
  @ApiBadRequestResponse({ description: 'Validação ou email/CPF em uso' })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado' })
  async update(
    @Req() request: AuthenticatedRequest,
    @Body() dto: AtualizaAdminDto,
  ) {
    return this.adminService.updateProfile(request.user.userId, dto);
  }

  @Get('listar')
  @UseGuards(AdminPerfisGuard)
  @AdminPerfis(AdminPerfilEnum.GERENCIAL)
  @ApiOperation({
    summary: '[Gerencial] Listar todos os admins (equipe PROAE)',
    description:
      'Retorna nome, email, cargo, perfil de acesso e status de aprovação de cada admin. Usado pela tela de gerenciamento da equipe.',
  })
  @ApiOkResponse({ description: 'Lista retornada' })
  @ApiForbiddenResponse({ description: 'Apenas perfis gerenciais' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({
    name: 'busca',
    required: false,
    description: 'Busca por nome, email ou cargo',
  })
  @ApiQuery({
    name: 'perfil',
    required: false,
    enum: [AdminPerfilEnum.TECNICO, AdminPerfilEnum.GERENCIAL, AdminPerfilEnum.COORDENACAO],
  })
  @ApiQuery({
    name: 'aprovado',
    required: false,
    description: 'true para aprovados, false para pendentes',
  })
  async listarAdmins(
    @Req() request: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('busca') busca?: string,
    @Query('perfil') perfil?: string,
    @Query('aprovado') aprovado?: string,
  ) {
    return this.adminService.listAdminsForGerencial(request.user.userId, {
      page: page != null ? Number(page) : undefined,
      limit: limit != null ? Number(limit) : undefined,
      busca,
      perfil,
      aprovado:
        aprovado === 'true' || aprovado === '1'
          ? true
          : aprovado === 'false' || aprovado === '0'
            ? false
            : undefined,
    });
  }

  @Get('notificacoes-aprovacao')
  @UseGuards(AdminPerfisGuard)
  @AdminPerfis(AdminPerfilEnum.GERENCIAL)
  @ApiOperation({
    summary: '[Gerencial] Listar e-mails que recebem pedido de aprovação',
    description:
      'Quando a lista no banco está vazia, o envio usa ADMINS_EMAILS do ambiente (exibido em emails_ambiente).',
  })
  async listarNotificacoesAprovacao(@Req() request: AuthenticatedRequest) {
    return this.adminService.listNotificacaoEmails(request.user.userId);
  }

  @Post('notificacoes-aprovacao')
  @UseGuards(AdminPerfisGuard)
  @AdminPerfis(AdminPerfilEnum.GERENCIAL)
  @ApiOperation({
    summary: '[Gerencial] Adicionar e-mail à lista de notificações de aprovação',
  })
  async adicionarNotificacaoAprovacao(
    @Req() request: AuthenticatedRequest,
    @Body() dto: AdicionarAdminNotificacaoEmailDto,
  ) {
    return this.adminService.addNotificacaoEmail(
      request.user.userId,
      dto.email,
    );
  }

  @Delete('notificacoes-aprovacao/:emailId')
  @UseGuards(AdminPerfisGuard)
  @AdminPerfis(AdminPerfilEnum.GERENCIAL)
  @ApiOperation({
    summary: '[Gerencial] Remover e-mail da lista de notificações',
  })
  @ApiParam({ name: 'emailId', type: 'number' })
  async removerNotificacaoAprovacao(
    @Req() request: AuthenticatedRequest,
    @Param('emailId', ParseIntPipe) emailId: number,
  ) {
    return this.adminService.removeNotificacaoEmail(
      request.user.userId,
      emailId,
    );
  }

  @Patch(':adminId/perfil')
  @UseGuards(AdminPerfisGuard)
  @AdminPerfis(AdminPerfilEnum.GERENCIAL)
  @ApiOperation({
    summary: '[Gerencial] Alterar perfil de acesso de outro admin',
    description:
      'Atribui um dos perfis (tecnico, gerencial, coordenacao) ao admin alvo. Não permite auto-alteração — para mudar o próprio perfil, peça a outro gerencial.',
  })
  @ApiParam({ name: 'adminId', description: 'ID do admin alvo', type: 'number' })
  @ApiOkResponse({ description: 'Perfil atualizado' })
  @ApiBadRequestResponse({
    description:
      'Auto-alteração não permitida ou perfil inválido',
  })
  @ApiForbiddenResponse({ description: 'Apenas perfis gerenciais' })
  @ApiNotFoundResponse({ description: 'Admin não encontrado' })
  async alterarPerfilDeAdmin(
    @Req() request: AuthenticatedRequest,
    @Param('adminId', ParseIntPipe) adminId: number,
    @Body() dto: AtualizaAdminPerfilDto,
  ) {
    return this.adminService.updateAdminPerfilByGerencial(
      request.user.userId,
      adminId,
      dto.perfil,
    );
  }

  @Patch(':adminId/aprovar')
  @UseGuards(AdminPerfisGuard)
  @AdminPerfis(AdminPerfilEnum.GERENCIAL)
  @ApiOperation({
    summary: '[Gerencial] Aprovar cadastro de admin pendente',
    description:
      'Alternativa ao link do e-mail. Opcionalmente define o perfil de acesso na aprovação.',
  })
  @ApiParam({ name: 'adminId', type: 'number' })
  @ApiOkResponse({ description: 'Admin aprovado' })
  @ApiForbiddenResponse({ description: 'Apenas perfis gerenciais' })
  async aprovarAdmin(
    @Req() request: AuthenticatedRequest,
    @Param('adminId', ParseIntPipe) adminId: number,
    @Body() dto: AprovarAdminDto,
  ) {
    return this.adminService.approveAdminByGerencial(
      request.user.userId,
      adminId,
      dto.perfil,
    );
  }

  @Delete(':adminId/rejeitar')
  @UseGuards(AdminPerfisGuard)
  @AdminPerfis(AdminPerfilEnum.GERENCIAL)
  @ApiOperation({
    summary: '[Gerencial] Rejeitar cadastro de admin pendente',
    description: 'Remove o vínculo de admin pendente (equivalente ao link de rejeição do e-mail).',
  })
  @ApiParam({ name: 'adminId', type: 'number' })
  @ApiOkResponse({ description: 'Cadastro rejeitado' })
  @ApiForbiddenResponse({ description: 'Apenas perfis gerenciais' })
  async rejeitarAdmin(
    @Req() request: AuthenticatedRequest,
    @Param('adminId', ParseIntPipe) adminId: number,
  ) {
    return this.adminService.rejectAdminByGerencial(
      request.user.userId,
      adminId,
    );
  }

  @Delete(':adminId/perfil')
  @UseGuards(AdminPerfisGuard)
  @AdminPerfis(AdminPerfilEnum.GERENCIAL)
  @ApiOperation({
    summary: '[Gerencial] Excluir perfil de admin técnico/coordenacao',
    description:
      'Remove o vínculo administrativo da conta alvo. Esta ação não permite remover admins com perfil gerencial.',
  })
  @ApiParam({ name: 'adminId', type: 'number' })
  @ApiOkResponse({ description: 'Perfil administrativo removido' })
  @ApiForbiddenResponse({ description: 'Apenas perfis gerenciais' })
  @ApiBadRequestResponse({
    description:
      'Não permitido remover o próprio perfil, perfil gerencial ou admin inexistente',
  })
  async excluirPerfilAdmin(
    @Req() request: AuthenticatedRequest,
    @Param('adminId', ParseIntPipe) adminId: number,
  ) {
    return this.adminService.removeAdminPerfilByGerencial(
      request.user.userId,
      adminId,
    );
  }
}
