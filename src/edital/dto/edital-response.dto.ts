import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { EditalEnum } from 'src/enum/enumEdital';
import { StatusEdital } from 'src/enum/enumStatusEdital';
import { EtapaEdital } from 'src/entities/etapaEdital/etapaEdital.entity';

export class EditalResponseDto {
  @ApiProperty({ type: Number, description: 'ID do edital' })
  @Expose()
  id: number;

  @ApiProperty({ enum: EditalEnum, description: 'Tipo do edital' })
  @Expose()
  tipo_edital: EditalEnum;

  @ApiProperty({ type: String, description: 'Descrição do edital' })
  @Expose()
  descricao: string;

  @ApiProperty({ type: [String], description: 'URLs dos documentos do edital' })
  @Expose()
  edital_url: string[];

  @ApiProperty({ type: String, description: 'Título do edital' })
  @Expose()
  titulo_edital: string;

  @ApiProperty({
    type: Number,
    description: 'Quantidade de bolsas disponíveis',
  })
  @Expose()
  quantidade_bolsas: number;

  @ApiProperty({ enum: StatusEdital, description: 'Status do edital' })
  @Expose()
  status_edital: StatusEdital;

  @ApiProperty({ type: [EtapaEdital], description: 'Etapas do edital' })
  @Expose()
  @Type(() => EtapaEdital)
  etapas: EtapaEdital[];
}
