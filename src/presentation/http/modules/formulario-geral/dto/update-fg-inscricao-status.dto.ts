import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { StatusInscricao } from 'src/core/shared-kernel/enums/enumStatusInscricao';

export class UpdateFGInscricaoStatusDto {
  @ApiProperty({ enum: StatusInscricao, description: 'Novo status da inscrição' })
  @IsEnum(StatusInscricao)
  status: StatusInscricao;

  @ApiPropertyOptional({ description: 'Observação/feedback do admin para o aluno' })
  @IsOptional()
  @IsString()
  observacao?: string;
}
