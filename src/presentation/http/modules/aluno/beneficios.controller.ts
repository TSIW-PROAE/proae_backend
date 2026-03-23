import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/presentation/http/modules/auth/guards/jwt-auth.guard';
import AuthenticatedRequest from 'src/core/shared-kernel/types/authenticated-request.interface';
import { AlunoService } from './aluno.service';

/**
 * Rotas em `/beneficios/*` consumidas pelo portal do aluno (ex.: card "Meus benefícios").
 */
@ApiTags('Benefícios (portal aluno)')
@ApiBearerAuth()
@Controller('beneficios')
@UseGuards(JwtAuthGuard)
export class BeneficiosController {
  constructor(private readonly alunoService: AlunoService) {}

  @Get('aluno')
  @ApiOperation({
    summary: 'Listar benefícios ativos do aluno logado',
    description:
      'Retorna inscrições em que o aluno é **Beneficiário no edital** e a **Inscrição Aprovada** na análise. Formato esperado pelo frontend (`dados.beneficios`).',
  })
  async listarBeneficiosAluno(@Req() request: AuthenticatedRequest) {
    return this.alunoService.listarBeneficiosPortalAluno(
      request.user.userId,
      request.user.roles,
    );
  }
}
