import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { StatusEdital } from 'src/enum/enumStatusEdital';
import { CreateEditalDto } from './create-edital.dto';

export class UpdateEditalDto extends PartialType(CreateEditalDto) {
  @ApiProperty({
    description: 'Status do edital',
    example: StatusEdital.EM_ANDAMENTO,
  })
  @IsNotEmpty()
  @IsEnum(StatusEdital)
  status_edital: StatusEdital;
}
