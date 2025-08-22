import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateStepDto {
  @ApiProperty({ description: 'Texto descritivo do step', required: false })
  @IsOptional()
  @IsString()
  texto?: string;
}
