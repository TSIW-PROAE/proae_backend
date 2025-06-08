import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiOkResponse, ApiCreatedResponse, ApiNotFoundResponse, ApiTags } from '@nestjs/swagger';
import { ValidacaoService } from './validacao.service';
import { CreateValidacaoDto } from './dto/create-validacao.dto';
import { UpdateValidacaoDto } from './dto/update-validacao.dto';
import { ValidacaoResponseDto } from './dto/validacao-response.dto';

@ApiTags('validacao')
@Controller('validacao')
export class ValidacaoController {
  constructor(private readonly validacaoService: ValidacaoService) { }

  @Post()
  @ApiCreatedResponse({ type: ValidacaoResponseDto })
  create(@Body() createValidacaoDto: CreateValidacaoDto) {
    return this.validacaoService.create(createValidacaoDto);
  }

  @Get()
  @ApiOkResponse({ type: [ValidacaoResponseDto] })
  findAll() {
    return this.validacaoService.findAll();
  }

  @Get(':id')
  @ApiOkResponse({ type: ValidacaoResponseDto })
  @ApiNotFoundResponse({ description: 'Validação não encontrada' })
  findOne(@Param('id') id: string) {
    return this.validacaoService.findOne(+id);
  }

  @Patch(':id')
  @ApiOkResponse({ type: ValidacaoResponseDto })
  @ApiNotFoundResponse({ description: 'Validação não encontrada' })
  update(@Param('id') id: string, @Body() updateValidacaoDto: UpdateValidacaoDto) {
    return this.validacaoService.update(+id, updateValidacaoDto);
  }

  @Delete(':id')
  @ApiOkResponse({ schema: { example: { message: 'Validação removida com sucesso' } } })
  @ApiNotFoundResponse({ description: 'Validação não encontrada' })
  remove(@Param('id') id: string) {
    return this.validacaoService.remove(+id);
  }
}
