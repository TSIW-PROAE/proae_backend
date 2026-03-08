import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Req,
  UseGuards,
  Param,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import AuthenticatedRequest from '../core/shared-kernel/types/authenticated-request.interface';
import { AlunoService } from './aluno.service';
import { AtualizaDadosAlunoDTO } from './dto/atualizaDadosAluno';
import {
  FindAlunoByUserIdUseCase,
  ListAlunosUseCase,
  UpdateAlunoDataUseCase,
  AlunoNaoEncontradoError,
  NenhumAlunoEncontradoError,
} from '../core/application/aluno';

@ApiTags('Alunos')
@ApiBearerAuth()
@Controller('aluno')
@UseGuards(JwtAuthGuard)
export class AlunoController {
  constructor(
    private readonly findAlunoByUserId: FindAlunoByUserIdUseCase,
    private readonly listAlunos: ListAlunosUseCase,
    private readonly updateAlunoData: UpdateAlunoDataUseCase,
    private readonly alunoService: AlunoService,
  ) {}

  @Get('me')
  @ApiOperation({ 
    summary: 'Buscar dados do aluno autenticado',
    description: 'Retorna os dados do aluno baseado no token JWT fornecido'
  })
  @ApiOkResponse({ 
    description: 'Dados do aluno encontrados com sucesso',
    schema: {
      example: {
        sucesso: true,
        dados: {
          aluno: {
            aluno_id: 1,
            email: "aluno@exemplo.com",
            matricula: "2024001",
            data_nascimento: "2000-01-01",
            curso: "Ciência da Computação",
            campus: "Vitória da Conquista",
            cpf: "123.456.789-00",
            data_ingresso: "2024-01-01",
            celular: "(77) 99999-9999",
            inscricoes: []
          }
        }
      }
    }
  })
  @ApiNotFoundResponse({ 
    description: 'Aluno não encontrado',
    schema: {
      example: {
        statusCode: 404,
        message: 'Aluno não encontrado',
        timestamp: '2025-01-27T10:00:00.000Z'
      }
    }
  })
  async findOne(@Req() request: AuthenticatedRequest) {
    const { userId } = request.user;
    try {
      return await this.findAlunoByUserId.execute(userId);
    } catch (e) {
      if (e instanceof AlunoNaoEncontradoError) {
        throw new NotFoundException(e.message);
      }
      throw e;
    }
  }

  @Get('all')
  @ApiOperation({ 
    summary: 'Listar todos os alunos',
    description: 'Retorna uma lista com todos os alunos cadastrados no sistema'
  })
  @ApiOkResponse({ 
    description: 'Lista de alunos encontrada com sucesso',
    schema: {
      example: {
        sucesso: true,
        dados: [
          {
            aluno_id: 1,
            email: "aluno@exemplo.com",
            matricula: "2024001",
            data_nascimento: "2000-01-01",
            curso: "Ciência da Computação",
            campus: "Vitória da Conquista",
            cpf: "123.456.789-00",
            data_ingresso: "2024-01-01",
            celular: "(77) 99999-9999",
            inscricoes: []
          }
        ]
      }
    }
  })
  @ApiNotFoundResponse({ 
    description: 'Nenhum aluno encontrado',
    schema: {
      example: {
        statusCode: 404,
        message: 'Alunos não encontrados.',
        timestamp: '2025-01-27T10:00:00.000Z'
      }
    }
  })
  async findAll() {
    try {
      return await this.listAlunos.execute();
    } catch (e) {
      if (e instanceof NenhumAlunoEncontradoError) {
        throw new NotFoundException(e.message);
      }
      throw e;
    }
  }

  @Patch('/update')
  @ApiOperation({ 
    summary: 'Atualizar dados do aluno',
    description: 'Permite ao aluno atualizar seus dados pessoais'
  })
  @ApiOkResponse({ 
    description: 'Dados do aluno atualizados com sucesso',
    schema: {
      example: {
        success: true,
        message: 'Dados do aluno atualizados com sucesso!'
      }
    }
  })
  @ApiBadRequestResponse({ 
    description: 'Dados inválidos ou email já em uso',
    schema: {
      example: {
        statusCode: 400,
        message: 'Email já está em uso.',
        timestamp: '2025-01-27T10:00:00.000Z'
      }
    }
  })
  @ApiNotFoundResponse({ 
    description: 'Aluno não encontrado',
    schema: {
      example: {
        statusCode: 404,
        message: 'Aluno não encontrado.',
        timestamp: '2025-01-27T10:00:00.000Z'
      }
    }
  })
  async updateStudentData(
    @Req() request: AuthenticatedRequest,
    @Body() atualizaDadosAlunoDTO: AtualizaDadosAlunoDTO,
  ) {
    const { userId } = request.user;
    const hasAnyData = Object.values(atualizaDadosAlunoDTO).some(
      (v) => v !== undefined && v !== null && v !== '',
    );
    if (!hasAnyData) {
      throw new BadRequestException('Dados para atualização não fornecidos.');
    }
    try {
      await this.updateAlunoData.execute(userId, {
        nome: atualizaDadosAlunoDTO.nome,
        email: atualizaDadosAlunoDTO.email,
        matricula: atualizaDadosAlunoDTO.matricula,
        dataNascimento: atualizaDadosAlunoDTO.data_nascimento,
        curso: atualizaDadosAlunoDTO.curso,
        campus: atualizaDadosAlunoDTO.campus,
        dataIngresso: atualizaDadosAlunoDTO.data_ingresso,
        celular: atualizaDadosAlunoDTO.celular,
      });
      return { success: true, message: 'Dados do aluno atualizados com sucesso!' };
    } catch (e) {
      if (e instanceof AlunoNaoEncontradoError) {
        throw new NotFoundException(e.message);
      }
      if (e instanceof Error && e.message === 'Email já está em uso.') {
        throw new BadRequestException(e.message);
      }
      throw e;
    }
  }

  @Get('/inscricoes')
  @ApiOperation({ 
    summary: 'Buscar inscrições do aluno',
    description: 'Retorna todas as inscrições do aluno autenticado'
  })
  @ApiOkResponse({ 
    description: 'Inscrições do aluno encontradas com sucesso',
    schema: {
      example: {
        sucesso: true,
        dados: [
          {
            edital_id: 1,
            inscricao_id: 1,
            titulo_edital: 'Edital de Bolsa 2024',
            status_edital: 'Aberto',
            etapas_edital: [],
            status_inscricao: 'Pendente',
            possui_pendencias: false
          }
        ]
      }
    }
  })
  @ApiNotFoundResponse({ 
    description: 'Aluno não encontrado',
    schema: {
      example: {
        statusCode: 404,
        message: 'Aluno não encontrado.',
        timestamp: '2025-01-27T10:00:00.000Z'
      }
    }
  })
  async getStudentRegistration(@Req() request: AuthenticatedRequest) {
    const { userId } = request.user;
    return this.alunoService.getStudentRegistration(userId);
  }

  @Get('/edital/:editalId/step/:stepId/alunos')
  @ApiOperation({ 
    summary: 'Listar alunos inscritos em questionário específico',
    description: 'Retorna todos os alunos que responderam um questionário (step) específico de um edital'
  })
  @ApiParam({ 
    name: 'editalId', 
    description: 'ID do edital',
    type: 'number',
    example: 1
  })
  @ApiParam({ 
    name: 'stepId', 
    description: 'ID do step/questionário',
    type: 'number',
    example: 1
  })
  @ApiOkResponse({ 
    description: 'Lista de alunos inscritos no questionário encontrada com sucesso',
    schema: {
      example: {
        sucesso: true,
        dados: {
          edital: {
            id: 1,
            titulo: 'Edital de Bolsa 2024',
            descricao: 'Edital para bolsas de estudo',
            status: 'Aberto'
          },
          step: {
            id: 1,
            texto: 'Questionário socioeconômico'
          },
          total_alunos: 2,
          alunos: [
            {
              aluno_id: 1,
              usuario_id: '550e8400-e29b-41d4-a716-446655440000',
              email: 'aluno1@exemplo.com',
              nome: 'João Silva',
              matricula: '2024001',
              cpf: '123.456.789-00',
              celular: '(77) 99999-9999',
              curso: 'Ciência da Computação',
              campus: 'Vitória da Conquista',
              data_nascimento: '2000-01-01',
              data_ingresso: '2024-01-01',
              inscricao_id: 1,
              status_inscricao: 'Pendente',
              data_inscricao: '2024-01-15',
              respostas_step: [
                {
                  pergunta_id: 1,
                  pergunta_texto: 'Qual sua renda familiar?',
                  resposta_texto: 'Renda entre 1 e 3 salários mínimos',
                  data_resposta: '2024-01-15T10:00:00.000Z'
                }
              ]
            }
          ]
        }
      }
    }
  })
  @ApiNotFoundResponse({ 
    description: 'Edital ou step não encontrado',
    schema: {
      example: {
        statusCode: 404,
        message: 'Edital com ID 1 não encontrado.',
        timestamp: '2025-01-27T10:00:00.000Z'
      }
    }
  })
  @ApiBadRequestResponse({ 
    description: 'Parâmetros inválidos',
    schema: {
      example: {
        statusCode: 400,
        message: 'ID do edital e step devem ser números válidos',
        timestamp: '2025-01-27T10:00:00.000Z'
      }
    }
  })
  async findAlunosInscritosEmStep(
    @Param('editalId', ParseIntPipe) editalId: number,
    @Param('stepId', ParseIntPipe) stepId: number,
  ) {
    return this.alunoService.findAlunosInscritosEmStep(editalId, stepId);
  }
}
