import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';
import { CreateRespostaDto } from './create-resposta-dto';

export class UpdateRespostaDto extends PartialType(CreateRespostaDto) {
  @ApiProperty({
    description: 'ID da resposta',
    example: 1,
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  id: number;
}