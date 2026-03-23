import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, ValidateNested } from 'class-validator';
import { RespostaInscricaoDto } from './resposta-inscricao.dto';

export class CreateInscricaoDto {
  @ApiProperty({
    description: 'ID da vaga',
    example: 1,
    required: true,
  })
  @Transform(({ value }) => (typeof value === 'string' ? parseInt(value, 10) : value))
  @IsNotEmpty()
  @IsNumber()
  vaga_id: number;

  @ApiProperty({
    type: [RespostaInscricaoDto],
    description: 'Lista de respostas da inscrição (cada uma com perguntaId e valorTexto/valorOpcoes/urlArquivo)',
    required: true,
  })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RespostaInscricaoDto)
  respostas: RespostaInscricaoDto[];
}
