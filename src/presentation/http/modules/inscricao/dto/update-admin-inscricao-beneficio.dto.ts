import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { StatusBeneficioEdital } from 'src/core/shared-kernel/enums/enumStatusBeneficioEdital';

export class UpdateAdminInscricaoBeneficioDto {
  @ApiProperty({
    enum: StatusBeneficioEdital,
    example: StatusBeneficioEdital.BENEFICIARIO,
    description:
      'Situação do estudante quanto ao benefício no edital (independe do status de análise da inscrição).',
  })
  @IsEnum(StatusBeneficioEdital)
  status_beneficio_edital: StatusBeneficioEdital;

  @ApiProperty({
    required: false,
    default: false,
    description:
      'Quando true e o status for "Beneficiário no edital", permite homologar acima do limite de vagas com trilha de auditoria.',
  })
  @IsOptional()
  @IsBoolean()
  permitir_exceder_vagas?: boolean;

  @ApiProperty({
    required: false,
    example: 'Caso social prioritário autorizado pela coordenação.',
    description:
      'Obrigatório quando permitir_exceder_vagas=true. Justificativa da exceção de vagas.',
  })
  @IsOptional()
  @IsString()
  @MinLength(10)
  justificativa_override?: string;
}
