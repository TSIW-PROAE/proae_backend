import { Controller, Get, InternalServerErrorException, NotFoundException, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
import { StepResponseDto } from './dto/response-step.dto';
import { StepService } from './step.service';
import { errorExamples } from '@/src/common/swagger/error-examples';

@ApiTags('Steps')
@ApiBearerAuth()
@Controller('steps')
export class StepController {
  constructor(private readonly stepService: StepService) {}
  @Get('edital/:id')
  @ApiOperation({ summary: 'Buscar step por ID' })
  @ApiResponse({ status: 200, description: 'Step encontrado com sucesso', type: [StepResponseDto]})
  @ApiResponse({ status: 404, description: 'Step não encontrado', schema: { example: errorExamples.notFound }})
  @ApiResponse({ status: 500, description: 'Erro interno do servidor', schema: { example: errorExamples.internalServerError }})
  async findStepsByEdital(@Param('id', ParseIntPipe) id: number): Promise<StepResponseDto[]> {
    try {
      return this.stepService.findStepsByEdital(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro interno do servidor');
    }
  }
} 