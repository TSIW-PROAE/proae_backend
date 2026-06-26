import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { StatusInscricao } from 'src/core/shared-kernel/enums/enumStatusInscricao';

/** Admin: alterar status de qualquer inscrição (editais comuns, CG ou renovação). */
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

  @ApiPropertyOptional({
    description:
      'Em chamadas de Cadastro Geral: registra PCD no perfil do aluno ao deferir (permite 2 benefícios).',
  })
  @IsOptional()
  @IsBoolean()
  marcar_pcd_cg?: boolean;
}
