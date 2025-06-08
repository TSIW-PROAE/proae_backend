import {
  Controller,
  Post,
  Body,
  Put,
  Param,
  Req,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { InscricaoService } from './inscricao.service';
import { CreateInscricaoDto } from './dto/create-inscricao-dto';
import { UpdateInscricaoDto } from './dto/upload-inscricao-dto';
import AuthenticatedRequest from 'src/types/authenticated-request.interface';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('inscricoes')
export class InscricaoController {
  constructor(private readonly inscricaoService: InscricaoService) {}

  @UseGuards(AuthGuard)
  @Post()
  async createInscricao(
    @Req() request: AuthenticatedRequest,
    @Body() createInscricaoDto: CreateInscricaoDto,
  ) {
    return await this.inscricaoService.createInscricao(createInscricaoDto);
  }

  @Patch(':id')
  async updateInscricao(
    @Param('id') id: number,
    @Body() updateInscricaoDto: UpdateInscricaoDto,
  ) {
    return await this.inscricaoService.updateInscricao(id, updateInscricaoDto);
  }
}
