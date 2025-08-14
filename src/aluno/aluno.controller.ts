import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import AuthenticatedRequest from '../types/authenticated-request.interface';
import { AlunoService } from './aluno.service';
import { AtualizaDadosAlunoDTO } from './dto/atualizaDadosAluno';

@ApiTags('Alunos')
@ApiBearerAuth()
@Controller('aluno')
@UseGuards(JwtAuthGuard)
export class AlunoController {
  constructor(private readonly alunoService: AlunoService) {}

  @Get()
  async findOne(@Req() request: AuthenticatedRequest) {
    const { userId } = request.user;
    return this.alunoService.findByUserId(userId);
  }

  @Patch('/update')
  async updateStudentData(
    @Req() request: AuthenticatedRequest,
    @Body() atualizaDadosAlunoDTO: AtualizaDadosAlunoDTO,
  ) {
    const { userId } = request.user;
    return this.alunoService.updateStudentData(userId, atualizaDadosAlunoDTO);
  }

  @Get('/inscricoes')
  async getStudentRegistration(@Req() request: AuthenticatedRequest) {
    const { userId } = request.user;
    return this.alunoService.getStudentRegistration(userId);
  }
}
