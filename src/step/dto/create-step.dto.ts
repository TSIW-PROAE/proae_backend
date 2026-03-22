import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateStepDto {
  @ApiProperty({ description: 'ID do edital ao qual o step pertence' })
  @IsNotEmpty()
  @IsString()
  edital_id: string;

  @ApiProperty({ description: 'Texto descritivo do step' })
  @IsNotEmpty()
  @IsString()
  texto: string;
}
