import { ApiProperty } from '@nestjs/swagger';
import { StatusDocumento } from '../../enum/statusDocumento';

export class CreateValidacaoDto {
    @ApiProperty({ enum: StatusDocumento, description: 'Status da validação' })
    status: StatusDocumento;

    @ApiProperty({ type: String, required: false, description: 'Parecer do validador' })
    parecer: string;

    @ApiProperty({ type: String, format: 'date', required: false, description: 'Data da validação' })
    data_validacao: Date;
}