import { ApiProperty } from '@nestjs/swagger';
import { StatusDocumento } from '../../enum/statusDocumento';
import { IsDate, IsOptional, IsString } from 'class-validator';
import { IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateValidacaoDto {
    @IsNotEmpty()
    @IsString()
    @ApiProperty({ enum: StatusDocumento, description: 'Status da validação' })
    status: StatusDocumento;

    @IsOptional()
    @IsString()
    @ApiProperty({ type: String, required: false, description: 'Parecer do validador' })
    parecer: string;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    @ApiProperty({ type: Date, format: 'date', required: false, description: 'Data da validação' })
    data_validacao: Date;
}