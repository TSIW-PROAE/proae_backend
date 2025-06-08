import { Controller, Get, UseGuards, Req, Body, Patch } from '@nestjs/common';
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
  @Patch('/update')
  async updateStudentData(
    @Req() request: AuthenticatedRequest,
    @Body() atualizaDadosAlunoDTO: AtualizaDadosAlunoDTO,
  ) {
    const { id } = request.user;
    return this.alunoService.updateStudentData(id, atualizaDadosAlunoDTO);
  }

  @UseGuards(AuthGuard)
  @Get('/inscricoes')
  async getStudentRegistration(@Req() request: AuthenticatedRequest) {
    const { id } = request.user;
    return this.alunoService.getStudentRegistration(id);
  }
}
