import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import AuthenticatedRequest from '../types/authenticated-request.interface';
import { AlunoService } from './aluno.service';
import { AtualizaDadosAlunoDTO } from './dto/atualizaDadosAluno';

@ApiTags('Alunos')
@ApiBearerAuth()
@Controller('aluno')
@UseGuards(AuthGuard)
export class AlunoController {
  constructor(private readonly alunoService: AlunoService) {}

  @Get()
  async findOne(@Req() request: AuthenticatedRequest) {
    const { id } = request.user;
    return this.alunoService.findByClerkId(id);
  }

  @Patch('/update')
  async updateStudentData(
    @Req() request: AuthenticatedRequest,
    @Body() atualizaDadosAlunoDTO: AtualizaDadosAlunoDTO,
  ) {
    const { id } = request.user;
    return this.alunoService.updateStudentData(id, atualizaDadosAlunoDTO);
  }

  @Get('/inscricoes')
  async getStudentRegistration(@Req() request: AuthenticatedRequest) {
    const { id } = request.user;
    return this.alunoService.getStudentRegistration(id);
  }
}
