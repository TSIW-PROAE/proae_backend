import {
  Body,
  Controller,
  Get,
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
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles';
import { RolesEnum } from 'src/core/shared-kernel/enums/enumRoles';
import AuthenticatedRequest from 'src/core/shared-kernel/types/authenticated-request.interface';
import { JwtAuthGuard } from 'src/presentation/http/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/presentation/http/modules/auth/guards/roles.guard';
import { AdminService } from './admin.service';
import { AtualizaAdminDto } from './dto/atualiza-admin.dto';

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
}
