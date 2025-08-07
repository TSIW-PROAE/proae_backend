import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateRespostaDto {
  @ApiProperty({ type: Number, description: 'ID da pergunta' })
  @IsNotEmpty()
  @IsNumber()
  pergunta_id: number;

  @ApiProperty({ type: String, description: 'Texto da resposta' })
  @IsNotEmpty()
  @IsString()
  texto: string;
}
