import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import AuthenticatedRequest from '../types/authenticated-request.interface';
import { DocumentoService } from './documentos.service';
import { CreateDocumentoDto } from './dto/create-documento.dto';
import { ResubmitDocumentoDto } from './dto/resubmit-documento.dto';
import { UpdateDocumentoDto } from './dto/update-documento.dto';

@Controller('documentos')
@ApiBearerAuth()
@UseGuards(AuthGuard)
export class DocumentoController {
  constructor(private readonly documentoService: DocumentoService) {}

  @Post()
  async create(@Body() createDocumentoDto: CreateDocumentoDto) {
    return await this.documentoService.createDocumento(createDocumentoDto);
  }

  @Get('/inscricao/:inscricaoId')
  async findAllByInscricao(
    @Param('inscricaoId', ParseIntPipe) inscricaoId: number,
  ) {
    return await this.documentoService.findAllDocumentoByInscricao(inscricaoId);
  }

  @Get(':id')
  async findOneDocumento(@Param('id', ParseIntPipe) id: number) {
    return await this.documentoService.findOneDocumento(id);
  }

  @Put(':id')
  async updateDocumento(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDocumentoDto: UpdateDocumentoDto,
  ) {
    return await this.documentoService.updateDocumento(id, updateDocumentoDto);
  }

  @Delete(':id')
  async removeDocumento(@Param('id', ParseIntPipe) id: number) {
    return await this.documentoService.removeDocumento(id);
  }

  @Get('reprovados/meus')
  async getMyReprovadoDocuments(@Req() request: AuthenticatedRequest) {
    const { id } = request.user;
    return await this.documentoService.getReprovadoDocumentsByStudent(id);
  }

  @Put('resubmissao/:id')
  async resubmitDocument(
    @Param('id', ParseIntPipe) id: number,
    @Body() resubmitDocumentoDto: ResubmitDocumentoDto,
    @Req() request: AuthenticatedRequest,
  ) {
    const { id: clerkId } = request.user;
    return await this.documentoService.resubmitDocument(clerkId, id, resubmitDocumentoDto);
  }

  @Get('pendencias/meus')
  async getMyDocumentsWithProblems(@Req() request: AuthenticatedRequest) {
    const { id } = request.user;
    return await this.documentoService.getDocumentsWithProblemsByStudent(id);
  }
}
