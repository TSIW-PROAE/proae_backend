import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import AuthenticatedRequest from '../types/authenticated-request.interface';
import { BeneficioService } from './beneficio.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('beneficios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class BeneficioController {
  constructor(private readonly beneficioService: BeneficioService) {}

  @Get('aluno')
  async findOne(@Req() request: AuthenticatedRequest) {
    const { userId } = request.user;
    return this.beneficioService.findBenefitsByStudentId(userId);
  }
}
