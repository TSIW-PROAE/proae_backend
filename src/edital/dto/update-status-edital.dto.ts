import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { StatusEdital } from 'src/enum/enumStatusEdital';

export class UpdateStatusEditalDto {
  @ApiProperty({
    enum: StatusEdital,
    description: 'Novo status do edital',
    example: StatusEdital.ABERTO,
  })
  @IsNotEmpty()
  @IsEnum(StatusEdital)
  status_edital: StatusEdital;
}
