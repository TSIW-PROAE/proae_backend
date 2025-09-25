import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, ValidateNested } from 'class-validator';
import { CreateRespostaDto } from '../../resposta/dto/create-resposta.dto';

export class CreateInscricaoDto {
  @ApiProperty({
    description: 'ID da vaga',
    example: 1,
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  vaga_id: number;

  @ApiProperty({
    type: [CreateRespostaDto],
    description: 'Lista de respostas da inscrição',
    required: true,
  })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRespostaDto)
  respostas: CreateRespostaDto[];
}
