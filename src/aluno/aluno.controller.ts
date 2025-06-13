import { Controller, Get, UseGuards, Req, Body, Patch } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AlunoService } from './aluno.service';
import AuthenticatedRequest from '../types/authenticated-request.interface';
import { AtualizaDadosAlunoDTO } from './dto/atualizaDadosAluno';
import {
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger'; 

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
