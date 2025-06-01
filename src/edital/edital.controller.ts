import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { EditalService } from './edital.service';
import { CreateEditalDto } from './dto/create-edital.dto';
import { UpdateEditalDto } from './dto/update-edital.dto';

@Controller('editais')
export class EditalController {
  constructor(private readonly editalService: EditalService) {}

  @Post()
  async create(@Body() createEditalDto: CreateEditalDto) {
    return this.editalService.create(createEditalDto);
  }

  @Get()
  async findAll() {
    return this.editalService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.editalService.findOne(+id);
  }

  @Get('abertos')
  async findOpened() {
    return this.editalService.getEditalOpedened();
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateEditalDto: UpdateEditalDto,
  ) {
    return this.editalService.update(+id, updateEditalDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.editalService.remove(+id);
  }
}
