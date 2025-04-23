import { Type } from "class-transformer";
import { IsDate, IsEnum, IsObject, IsOptional, IsString, ValidateNested } from "class-validator";
import { EditalEnum } from "src/enum/enumEdital";
import { CreateEtapasDto } from "./create-etapas-edital.dto";

export class CreateEditalDto {
    @IsEnum(EditalEnum)
    tipo_beneficio: EditalEnum;

    @IsString()
    descricao: string;

    @IsString()
    edital_url: string;

    @IsDate()
    @Type(() => Date)
    data_inicio: Date;

    @IsDate()
    @Type(() => Date)
    data_fim: Date;

    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => CreateEtapasDto)
    etapas: CreateEtapasDto[];
}
