import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import AuthenticatedRequest from '../types/authenticated-request.interface';
import { BeneficioService } from './beneficio.service';

@Controller('beneficios')
@ApiBearerAuth()
@UseGuards(AuthGuard)
export class BeneficioController {
  constructor(private readonly beneficioService: BeneficioService) {}

  @Get('aluno')
  async findOne(@Req() request: AuthenticatedRequest) {
    const { userId } = request.user;
    return this.beneficioService.findBenefitsByStudentId(userId);
  }
}
