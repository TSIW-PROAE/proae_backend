import { PartialType } from '@nestjs/swagger';
import { CreateValidacaoDto } from './create-validacao.dto';

export class UpdateValidacaoDto extends PartialType(CreateValidacaoDto) { }
