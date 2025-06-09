import { PartialType } from '@nestjs/swagger';
import { CreateRespostaDto } from './create-resposta-dto';

export class UpdateRespostaDto extends PartialType(CreateRespostaDto) { } 