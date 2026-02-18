import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { CreateRespostaDto } from '../../resposta/dto/create-resposta.dto';

export class CreateInscricaoDto {
  @ApiProperty({
    description: 'ID da vaga',
    example: '550e8400-e29b-41d4-a916-446655440000',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  vaga_id: string;

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
