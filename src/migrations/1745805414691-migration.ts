import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1745805414691 implements MigrationInterface {
    name = 'Migration1745805414691'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "aluno" ("aluno_id" SERIAL NOT NULL, "id_clerk" character varying NOT NULL, "pronome" "public"."aluno_pronome_enum" NOT NULL, "data_nascimento" date NOT NULL, "curso" "public"."aluno_curso_enum" NOT NULL, "campus" "public"."aluno_campus_enum" NOT NULL, "cpf" character varying NOT NULL, "data_ingresso" date NOT NULL, "identidade" character varying NOT NULL, "celular" character varying NOT NULL, CONSTRAINT "PK_59b290e3568d6200112b91682ed" PRIMARY KEY ("aluno_id"))`);
        await queryRunner.query(`CREATE TABLE "resultado_etapa" ("resultado_id" SERIAL NOT NULL, "status_etapa" "public"."resultado_etapa_status_etapa_enum" NOT NULL, "observacao" text, "data_avaliacao" date, "inscricaoInscricaoId" integer, "etapaId" integer, CONSTRAINT "PK_ace10e69cfcef4dc9a417cd9a35" PRIMARY KEY ("resultado_id"))`);
        await queryRunner.query(`CREATE TABLE "etapa_inscricao" ("id" SERIAL NOT NULL, "nome" character varying NOT NULL, "ordem" integer NOT NULL, "data_inicio" date NOT NULL, "data_fim" date NOT NULL, "descricao" text, "editalId" integer, CONSTRAINT "PK_4a31674d149e935277165e7177c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "edital" ("id" SERIAL NOT NULL, "nome_edital" text NOT NULL, "descricao" text NOT NULL, "tipo_beneficio" text NOT NULL, "edital_url" text NOT NULL, "categoria_edital" text, "status_edital" text NOT NULL, "quantidade_bolsas" integer NOT NULL, CONSTRAINT "PK_521e2170c236167de6dc1e176f1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "documento" ("documento_id" SERIAL NOT NULL, "tipo_documento" "public"."documento_tipo_documento_enum" NOT NULL, "documento_url" character varying NOT NULL, "status_documento" "public"."documento_status_documento_enum" NOT NULL, "inscricaoInscricaoId" integer, CONSTRAINT "PK_9e5da115cf20260ba1b2d511d86" PRIMARY KEY ("documento_id"))`);
        await queryRunner.query(`CREATE TABLE "inscricao" ("inscricao_id" SERIAL NOT NULL, "data_inscricao" date NOT NULL, "status_inscricao" "public"."inscricao_status_inscricao_enum", "alunoAlunoId" integer, "editalId" integer, CONSTRAINT "PK_989c86adc44071ebe6372a44d81" PRIMARY KEY ("inscricao_id"))`);
        await queryRunner.query(`CREATE TABLE "formulario" ("formulario_id" SERIAL NOT NULL, "titulo_formulario" character varying NOT NULL, CONSTRAINT "PK_3f91c756a8cfb2afbd4b98e2007" PRIMARY KEY ("formulario_id"))`);
        await queryRunner.query(`CREATE TABLE "pergunta" ("pergunta_id" SERIAL NOT NULL, "pergunta" character varying NOT NULL, "formularioFormularioId" integer, CONSTRAINT "PK_5dbd352ce7befc5cfc2cb5f267c" PRIMARY KEY ("pergunta_id"))`);
        await queryRunner.query(`CREATE TABLE "resposta" ("resposta_id" SERIAL NOT NULL, "resposta" character varying NOT NULL, "perguntaPerguntaId" integer, CONSTRAINT "PK_ea4098128e221dc22fb98ba2f04" PRIMARY KEY ("resposta_id"))`);
        await queryRunner.query(`ALTER TABLE "resultado_etapa" ADD CONSTRAINT "FK_4a97430812d6696366b88399a8f" FOREIGN KEY ("inscricaoInscricaoId") REFERENCES "inscricao"("inscricao_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "resultado_etapa" ADD CONSTRAINT "FK_477b382c55bc3960a091fba1946" FOREIGN KEY ("etapaId") REFERENCES "etapa_inscricao"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "etapa_inscricao" ADD CONSTRAINT "FK_5bfbdaefbbc120a8e183b88beb3" FOREIGN KEY ("editalId") REFERENCES "edital"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "documento" ADD CONSTRAINT "FK_b5c3f36f0fdabc13dfd267cc90a" FOREIGN KEY ("inscricaoInscricaoId") REFERENCES "inscricao"("inscricao_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inscricao" ADD CONSTRAINT "FK_d6688bd0c3f0d1ba6b42978d6bd" FOREIGN KEY ("alunoAlunoId") REFERENCES "aluno"("aluno_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inscricao" ADD CONSTRAINT "FK_ca26b52c70a97fd8d3cf0ba7eff" FOREIGN KEY ("editalId") REFERENCES "edital"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pergunta" ADD CONSTRAINT "FK_619b8b5647b475c0169ba6c18f4" FOREIGN KEY ("formularioFormularioId") REFERENCES "formulario"("formulario_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "resposta" ADD CONSTRAINT "FK_2f813e8730022d0402140184ef3" FOREIGN KEY ("perguntaPerguntaId") REFERENCES "pergunta"("pergunta_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "resposta" DROP CONSTRAINT "FK_2f813e8730022d0402140184ef3"`);
        await queryRunner.query(`ALTER TABLE "pergunta" DROP CONSTRAINT "FK_619b8b5647b475c0169ba6c18f4"`);
        await queryRunner.query(`ALTER TABLE "inscricao" DROP CONSTRAINT "FK_ca26b52c70a97fd8d3cf0ba7eff"`);
        await queryRunner.query(`ALTER TABLE "inscricao" DROP CONSTRAINT "FK_d6688bd0c3f0d1ba6b42978d6bd"`);
        await queryRunner.query(`ALTER TABLE "documento" DROP CONSTRAINT "FK_b5c3f36f0fdabc13dfd267cc90a"`);
        await queryRunner.query(`ALTER TABLE "etapa_inscricao" DROP CONSTRAINT "FK_5bfbdaefbbc120a8e183b88beb3"`);
        await queryRunner.query(`ALTER TABLE "resultado_etapa" DROP CONSTRAINT "FK_477b382c55bc3960a091fba1946"`);
        await queryRunner.query(`ALTER TABLE "resultado_etapa" DROP CONSTRAINT "FK_4a97430812d6696366b88399a8f"`);
        await queryRunner.query(`DROP TABLE "resposta"`);
        await queryRunner.query(`DROP TABLE "pergunta"`);
        await queryRunner.query(`DROP TABLE "formulario"`);
        await queryRunner.query(`DROP TABLE "inscricao"`);
        await queryRunner.query(`DROP TABLE "documento"`);
        await queryRunner.query(`DROP TABLE "edital"`);
        await queryRunner.query(`DROP TABLE "etapa_inscricao"`);
        await queryRunner.query(`DROP TABLE "resultado_etapa"`);
        await queryRunner.query(`DROP TABLE "aluno"`);
    }

}