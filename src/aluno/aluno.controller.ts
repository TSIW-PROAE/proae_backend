import { Controller, Get, UseGuards, Req, Post, Body } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AlunoService } from './aluno.service';
import AuthenticatedRequest from '../types/authenticated-request.interface';
import { AtualizaDadosAlunoDTO } from './dto/atualizaDadosAluno';

@Controller('aluno')
export class AlunoController {
  constructor(private readonly alunoService: AlunoService) {}

  @UseGuards(AuthGuard)
  @Get()
  async findOne(@Req() request: AuthenticatedRequest) {
    const { id } = request.user;
    return this.alunoService.findByClerkId(id);
  }

  @UseGuards(AuthGuard)
  @Post(':id/update')
  async updateStudentData(
    @Req() request: AuthenticatedRequest,
    @Body() atualizaDadosAlunoDTO: AtualizaDadosAlunoDTO,
  ) {
    const { id } = request.user;
    return await this.alunoService.updateStudentData(id, atualizaDadosAlunoDTO);
  }
}
