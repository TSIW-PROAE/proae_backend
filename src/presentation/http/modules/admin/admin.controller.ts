import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
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
  async listarAdmins(@Req() request: AuthenticatedRequest) {
    return this.adminService.listAdminsForGerencial(request.user.userId);
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
}
