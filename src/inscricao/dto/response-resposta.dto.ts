import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class RespostaResponseDto {
    @ApiProperty({ type: Number, description: 'ID da resposta' })
    @Expose()
    resposta_id: number;

    @ApiProperty({ type: Number, description: 'ID da pergunta' })
    @Expose()
    pergunta_id: number;

    @ApiProperty({ type: String, description: 'Texto da resposta' })
    @Expose()
    texto: string;
} 