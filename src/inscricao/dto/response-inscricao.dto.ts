import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { StatusInscricao } from '../../enum/enumStatusInscricao';
import { RespostaResponseDto } from '../../resposta/dto/response-resposta.dto';

export class InscricaoResponseDto {
  @ApiProperty({ type: String, description: 'ID do aluno' })
  @Expose()
  aluno_id: string;

  @ApiProperty({ type: String, description: 'ID da vaga' })
  @Expose()
  vaga_id: string;

  @ApiProperty({ type: Date, description: 'Data da inscrição' })
  @Expose()
  data_inscricao: Date;

  @ApiProperty({ enum: StatusInscricao, description: 'Status da inscrição' })
  @Expose()
  status_inscricao: StatusInscricao;

  @ApiProperty({
    type: [RespostaResponseDto],
    description: 'Lista de respostas da inscrição',
  })
  @Expose()
  @Type(() => RespostaResponseDto)
  respostas: RespostaResponseDto[];
}
