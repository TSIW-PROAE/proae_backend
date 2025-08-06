import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import AuthenticatedRequest from '../types/authenticated-request.interface';
import { BeneficioService } from './beneficio.service';

@Controller('beneficios')
@ApiBearerAuth()  
export class BeneficioController {
  constructor(private readonly beneficioService: BeneficioService) {}

  @Get('aluno')
  async findOne(@Req() request: AuthenticatedRequest) {
    const { id } = request.user;
    return this.beneficioService.findBenefitsByStudentId(id);
  }
}