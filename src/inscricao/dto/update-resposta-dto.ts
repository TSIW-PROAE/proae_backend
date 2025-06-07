import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateRespostaDto } from './create-resposta-dto';
import { IsNumber } from 'class-validator';

export class UpdateRespostaDto extends PartialType(CreateRespostaDto) { } 