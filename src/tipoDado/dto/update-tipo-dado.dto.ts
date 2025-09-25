import { PartialType } from '@nestjs/swagger';
import { CreateDadoDto } from './create-tipo-dado.dto';

export class UpdateDadoDto extends PartialType(CreateDadoDto) {}
