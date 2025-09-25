import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateStepDto {
  @ApiProperty({ description: 'ID do edital ao qual o step pertence' })
  @IsNotEmpty()
  @IsNumber()
  edital_id: number;

  @ApiProperty({ description: 'Texto descritivo do step' })
  @IsNotEmpty()
  @IsString()
  texto: string;
}
