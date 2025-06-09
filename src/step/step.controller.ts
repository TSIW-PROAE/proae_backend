import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StepService } from './step.service';
import { StepResponseDto } from './dto/response-step.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@ApiTags('Steps')
@ApiBearerAuth()
//@UseGuards(AuthGuard)
@Controller('steps')
export class StepController {
  constructor(private readonly stepService: StepService) {}

  @Get('edital/:id')
  @ApiOperation({ summary: 'Buscar step por ID' })
  @ApiResponse({
    status: 200,
    description: 'Step encontrado com sucesso',
    type: [StepResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Step não encontrado' })
  async findStepsByEdital(@Param('id', ParseIntPipe) id: number): Promise<StepResponseDto[]> {
    return this.stepService.findStepsByEdital(id);
  }
} 