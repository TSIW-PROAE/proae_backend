import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { BeneficioService } from './beneficio.service';
import { AuthGuard } from '../auth/auth.guard';
import AuthenticatedRequest from '../types/authenticated-request.interface';

@Controller('beneficios')
export class BeneficioController {
  constructor(private readonly beneficioService: BeneficioService) {}

  @UseGuards(AuthGuard)
  @Get('aluno')
  async findOne(@Req() request: AuthenticatedRequest) {
    const { id } = request.user;
    return this.beneficioService.findBenefitsByStudentId(id);
  }
}
