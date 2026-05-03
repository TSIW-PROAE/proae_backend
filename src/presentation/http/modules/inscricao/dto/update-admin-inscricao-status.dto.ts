import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { StatusInscricao } from 'src/core/shared-kernel/enums/enumStatusInscricao';

/** Admin: alterar status de qualquer inscrição (editais comuns, FG ou renovação). */
export class UpdateAdminInscricaoStatusDto {
  @ApiProperty({ enum: StatusInscricao, description: 'Novo status da inscrição' })
  @IsEnum(StatusInscricao)
  status: StatusInscricao;

  @ApiPropertyOptional({
    description: 'Observação / motivo visível ao aluno (opcional)',
  })
  @IsOptional()
  @IsString()
  observacao?: string;
}
