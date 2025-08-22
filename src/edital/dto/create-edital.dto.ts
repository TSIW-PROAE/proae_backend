import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateEditalDto {
  @ApiProperty({ description: 'Título do edital' })
  @IsNotEmpty()
  @IsString()
  titulo_edital: string;
}
