import { Controller, Get, UseGuards, Req, UploadedFile, Patch, UseInterceptors, Body} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { AlunoService } from './aluno.service';
import AuthenticatedRequest from '../types/authenticated-request.interface';
import { AtualizaDadosAlunoDTO } from './dto/atualizaDadosAluno';
import { FileInterceptor } from '@nestjs/platform-express';

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
  @Patch('image')
  @UseInterceptors(FileInterceptor('file'))
  async atualizarFotoPerfil(
    @Req() request: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const { id } = request.user;

    if (!file) {
      throw new Error('Nenhum arquivo enviado');
    }
    const { filename } = file;
    return this.alunoService.updateImageProfile(id, filename);
  }

}
