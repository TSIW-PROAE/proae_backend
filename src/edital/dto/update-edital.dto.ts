import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateEditalDto } from './create-edital.dto';
import { StatusEdital } from 'src/enum/enumStatusEdital';

export class UpdateEditalDto extends PartialType(CreateEditalDto) {
  @ApiProperty({ description: 'Status do edital', example: StatusEdital.EM_ANDAMENTO })
  @IsNotEmpty()
  @IsEnum(StatusEdital)
  status_edital: StatusEdital;
}
