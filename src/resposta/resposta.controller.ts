import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { RespostaService } from './resposta.service';
import { CreateRespostaDto } from './dto/create-resposta.dto';
import { UpdateRespostaDto } from './dto/update-resposta.dto';
import {
  ApiTags,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { RespostaResponseDto } from './dto/response-resposta.dto';

@ApiTags('Respostas')
@Controller('respostas')
export class RespostaController {
  constructor(private readonly respostaService: RespostaService) {}

  @Post()
  @ApiCreatedResponse({
    type: RespostaResponseDto,
    description: 'Resposta criada com sucesso',
  })
  create(@Body() dto: CreateRespostaDto) {
    return this.respostaService.create(dto);
  }

  @Get()
  @ApiOkResponse({
    type: [RespostaResponseDto],
    description: 'Lista de respostas',
  })
  findAll() {
    return this.respostaService.findAll();
  }

  @Get(':id')
  @ApiOkResponse({
    type: RespostaResponseDto,
    description: 'Resposta encontrada',
  })
  @ApiNotFoundResponse({ description: 'Resposta não encontrada' })
  findOne(@Param('id') id: number) {
    return this.respostaService.findOne(id);
  }

  @Patch(':id')
  @ApiOkResponse({
    type: RespostaResponseDto,
    description: 'Resposta atualizada',
  })
  @ApiNotFoundResponse({ description: 'Resposta não encontrada' })
  update(@Param('id') id: number, @Body() dto: UpdateRespostaDto) {
    return this.respostaService.update(id, dto);
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Resposta removida' })
  @ApiNotFoundResponse({ description: 'Resposta não encontrada' })
  remove(@Param('id') id: number) {
    return this.respostaService.remove(id);
  }
}
