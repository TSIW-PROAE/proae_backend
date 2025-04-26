import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1745690555268 implements MigrationInterface {
    name = 'Migration1745690555268'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "resultado_etapa" DROP CONSTRAINT "FK_f89fd8705637d03435bc49d47ba"`);
        await queryRunner.query(`ALTER TABLE "etapa_inscricao" DROP CONSTRAINT "FK_0e0e98a5824024d0404cc3b31ea"`);
        await queryRunner.query(`ALTER TABLE "inscricao" DROP CONSTRAINT "FK_e1c6311f32275ee89b295a1b8c6"`);
        await queryRunner.query(`ALTER TABLE "resultado_etapa" RENAME COLUMN "etapaEtapaId" TO "etapaId"`);
        await queryRunner.query(`ALTER TABLE "edital" RENAME COLUMN "beneficio_id" TO "id"`);
        await queryRunner.query(`ALTER TABLE "edital" RENAME CONSTRAINT "PK_8b1c76377e03bef7fd8247f8894" TO "PK_521e2170c236167de6dc1e176f1"`);
        await queryRunner.query(`ALTER SEQUENCE "edital_beneficio_id_seq" RENAME TO "edital_id_seq"`);
        await queryRunner.query(`ALTER TABLE "inscricao" RENAME COLUMN "editalBeneficioId" TO "editalId"`);
        await queryRunner.query(`ALTER TABLE "etapa_inscricao" DROP CONSTRAINT "PK_9023e92fe224e73a00963dbca93"`);
        await queryRunner.query(`ALTER TABLE "etapa_inscricao" DROP COLUMN "etapa_id"`);
        await queryRunner.query(`ALTER TABLE "etapa_inscricao" DROP COLUMN "nome_etapa"`);
        await queryRunner.query(`ALTER TABLE "etapa_inscricao" DROP COLUMN "ordem_etapa"`);
        await queryRunner.query(`ALTER TABLE "etapa_inscricao" DROP COLUMN "descricao_etapa"`);
        await queryRunner.query(`ALTER TABLE "etapa_inscricao" DROP COLUMN "editalBeneficioId"`);
        await queryRunner.query(`ALTER TABLE "etapa_inscricao" ADD "id" SERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "etapa_inscricao" ADD CONSTRAINT "PK_4a31674d149e935277165e7177c" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "etapa_inscricao" ADD "nome" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "etapa_inscricao" ADD "ordem" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "etapa_inscricao" ADD "descricao" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "etapa_inscricao" ADD "editalId" integer`);
        await queryRunner.query(`ALTER TABLE "edital" ALTER COLUMN "status_edital" SET DEFAULT 'Beneficio ativo'`);
        await queryRunner.query(`ALTER TABLE "resultado_etapa" ADD CONSTRAINT "FK_477b382c55bc3960a091fba1946" FOREIGN KEY ("etapaId") REFERENCES "etapa_inscricao"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "etapa_inscricao" ADD CONSTRAINT "FK_5bfbdaefbbc120a8e183b88beb3" FOREIGN KEY ("editalId") REFERENCES "edital"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inscricao" ADD CONSTRAINT "FK_ca26b52c70a97fd8d3cf0ba7eff" FOREIGN KEY ("editalId") REFERENCES "edital"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inscricao" DROP CONSTRAINT "FK_ca26b52c70a97fd8d3cf0ba7eff"`);
        await queryRunner.query(`ALTER TABLE "etapa_inscricao" DROP CONSTRAINT "FK_5bfbdaefbbc120a8e183b88beb3"`);
        await queryRunner.query(`ALTER TABLE "resultado_etapa" DROP CONSTRAINT "FK_477b382c55bc3960a091fba1946"`);
        await queryRunner.query(`ALTER TABLE "edital" ALTER COLUMN "status_edital" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "etapa_inscricao" DROP COLUMN "editalId"`);
        await queryRunner.query(`ALTER TABLE "etapa_inscricao" DROP COLUMN "descricao"`);
        await queryRunner.query(`ALTER TABLE "etapa_inscricao" DROP COLUMN "ordem"`);
        await queryRunner.query(`ALTER TABLE "etapa_inscricao" DROP COLUMN "nome"`);
        await queryRunner.query(`ALTER TABLE "etapa_inscricao" DROP CONSTRAINT "PK_4a31674d149e935277165e7177c"`);
        await queryRunner.query(`ALTER TABLE "etapa_inscricao" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "etapa_inscricao" ADD "editalBeneficioId" integer`);
        await queryRunner.query(`ALTER TABLE "etapa_inscricao" ADD "descricao_etapa" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "etapa_inscricao" ADD "ordem_etapa" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "etapa_inscricao" ADD "nome_etapa" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "etapa_inscricao" ADD "etapa_id" SERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "etapa_inscricao" ADD CONSTRAINT "PK_9023e92fe224e73a00963dbca93" PRIMARY KEY ("etapa_id")`);
        await queryRunner.query(`ALTER TABLE "inscricao" RENAME COLUMN "editalId" TO "editalBeneficioId"`);
        await queryRunner.query(`ALTER SEQUENCE "edital_id_seq" RENAME TO "edital_beneficio_id_seq"`);
        await queryRunner.query(`ALTER TABLE "edital" RENAME CONSTRAINT "PK_521e2170c236167de6dc1e176f1" TO "PK_8b1c76377e03bef7fd8247f8894"`);
        await queryRunner.query(`ALTER TABLE "edital" RENAME COLUMN "id" TO "beneficio_id"`);
        await queryRunner.query(`ALTER TABLE "resultado_etapa" RENAME COLUMN "etapaId" TO "etapaEtapaId"`);
        await queryRunner.query(`ALTER TABLE "inscricao" ADD CONSTRAINT "FK_e1c6311f32275ee89b295a1b8c6" FOREIGN KEY ("editalBeneficioId") REFERENCES "edital"("beneficio_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "etapa_inscricao" ADD CONSTRAINT "FK_0e0e98a5824024d0404cc3b31ea" FOREIGN KEY ("editalBeneficioId") REFERENCES "edital"("beneficio_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "resultado_etapa" ADD CONSTRAINT "FK_f89fd8705637d03435bc49d47ba" FOREIGN KEY ("etapaEtapaId") REFERENCES "etapa_inscricao"("etapa_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
