import { Type } from "class-transformer";
import { IsDate, IsNumber, IsString } from "class-validator";

export class CreateEtapasDto {
    // @IsNumber()
    // edital_id: number;

    @IsString()
    nome: string;

    @IsString()
    descricao: string;

    @IsNumber()
    ordem: number;

    // @IsDate()
    // @Type(() => Date)
    // data_inicio: Date;

    // @IsDate()
    // @Type(() => Date)
    // data_fim: Date;
}