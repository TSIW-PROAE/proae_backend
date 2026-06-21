import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class AprovarAdminDto {
  @ApiPropertyOptional({
    description:
      'Perfil de acesso após aprovação (tecnico, gerencial, coordenacao). Omitir para manter o perfil solicitado no cadastro.',
    enum: ['tecnico', 'gerencial', 'coordenacao'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['tecnico', 'gerencial', 'coordenacao'])
  perfil?: string;
}
