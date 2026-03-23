import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
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
}
