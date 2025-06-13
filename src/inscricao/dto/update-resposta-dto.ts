import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateRespostaDto } from './create-resposta-dto';
import { IsNotEmpty } from 'class-validator';
import { IsNumber } from 'class-validator';

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