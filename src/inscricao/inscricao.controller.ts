import { Controller, Post, Body, Put, Param } from '@nestjs/common';
import { InscricaoService } from './inscricao.service';
import { CreateInscricaoDto } from './dto/create-inscricao-dto';
import { UpdateInscricaoDto } from './dto/upload-inscricao-dto';

@Controller('inscricoes')
export class InscricaoController {
  constructor(private readonly inscricaoService: InscricaoService) {}

  @Post()
  async createInscricao(@Body() createInscricaoDto: CreateInscricaoDto) {
    return await this.inscricaoService.createInscricao(createInscricaoDto);
  }

  @Put(':id')
  async updateInscricao(
    @Param('id') id: number,
    @Body() updateInscricaoDto: UpdateInscricaoDto,
  ) {
    return await this.inscricaoService.updateInscricao(id, updateInscricaoDto);
  }
}
