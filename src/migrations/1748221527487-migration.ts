import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1748221527487 implements MigrationInterface {
    name = 'Migration1748221527487'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."aluno_pronome_enum" AS ENUM('ela/dela', 'ele/dele', 'elu/delu', 'Prefiro não informar')`);
        await queryRunner.query(`CREATE TYPE "public"."aluno_curso_enum" AS ENUM('Arquitetura e Urbanismo', 'Arquitetura e Urbanismo – Noturno', 'Engenharia da Computação', 'Engenharia de Agrimensura e Cartográfica', 'Engenharia de Controle e Automação', 'Engenharia de Minas', 'Engenharia de Produção', 'Engenharia Elétrica', 'Engenharia Mecânica', 'Engenharia Química', 'Ciências Sociais (Lic. e Bach.)', 'Filosofia', 'História (Lic. e Bach.)', 'História (Lic.) – Noturno', 'Museologia', 'Psicologia – Formação de Psicólogo', 'Serviço social', 'Tecnologia em Transporte Terrestre', 'Ciência da Computação', 'Estatística', 'Física (Lic) – Noturno', 'Física (Lic. e Bach.)', 'Geofísica', 'Geografia (Lic.) – Noturno', 'Licenciatura em Computação – Noturno', 'Matemática (Lic.) – Noturno', 'Oceanografia', 'Química (Lic. Bach. e Química Industrial)', 'Química (Lic.)', 'Sistemas de Informação – Bacharelado', 'Ciências Biológicas (Lic. e Bach.)', 'Ciências Biológicas (Lic.) – Noturno', 'Farmácia', 'Farmácia – Noturno', 'Gastronomia', 'Licenciatura em Ciências Naturais', 'Medicina Veterinária', 'Zootecnia', 'Comunicação – Jornalismo', 'Comunicação – Produção em Comunicação e Cultura', 'Estudos de Gênero e Diversidade (Bach.)', 'Letras Vernáculas (Lic. e Bach.)', 'Letras Vernáculas (Lic.)', 'Letras Vernáculas e Língua Estrangeira Moderna (Lic.)', 'Língua Estrangeira – Inglês/Espanhol (Lic.)', 'Língua Estrangeira Moderna ou Clássica (Lic. e Bach.)', 'Dança', 'Artes', 'Artes – Noturno', 'Ciência e Tecnologia – Noturno', 'Humanidades – Noturno', 'Saúde', 'Saúde – Noturno', 'Enfermagem', 'Fisioterapia', 'Fonoaudiologia', 'Medicina', 'Nutrição', 'Odontologia', 'Saúde Coletiva', 'Terapia Ocupacional', 'Arquivologia', 'Arquivologia – Noturno', 'Biblioteconomia e Documentação', 'Direito', 'Direito – Noturno', 'Licenciatura em Educação Física', 'Pedagogia', 'Secretariado Executivo', 'Artes Cênicas – Direção Teatral', 'Artes Cênicas – Interpretação Teatral', 'Artes Plásticas', 'Canto', 'Composição e Regência', 'Curso Superior de Decoração', 'Design', 'Instrumento', 'Licenciatura em Desenho e Plástica', 'Licenciatura em Música', 'Licenciatura em Teatro', 'Música Popular', 'Gestão Pública e Gestão Social', 'Ciências Contábeis', 'Ciências Contábeis – Noturno', 'Ciências Econômicas', 'Engenharia Civil', 'Engenharia Sanitária e Ambiental', 'Geografia (Lic. e Bach.)', 'Geologia', 'Matemática (Lic. e Bach.)', 'Química (Lic. e Bach.)', 'Ciências Biológicas (Lic. e Bach.) – Barreiras', 'Administração', 'Ciência e Tecnologia', 'Humanidades', 'Biotecnologia', 'Ciências Biológicas (Bach.)', 'Enfermagem – Vitória da Conquista', 'Farmácia – Vitória da Conquista', 'Nutrição – Vitória da Conquista', 'B.I. – C.T.I')`);
        await queryRunner.query(`CREATE TYPE "public"."aluno_campus_enum" AS ENUM('Vitória da Conquista', 'Salvador')`);
        await queryRunner.query(`CREATE TABLE "aluno" ("aluno_id" SERIAL NOT NULL, "id_clerk" character varying NOT NULL, "pronome" "public"."aluno_pronome_enum" NOT NULL, "data_nascimento" date NOT NULL, "curso" "public"."aluno_curso_enum" NOT NULL, "campus" "public"."aluno_campus_enum" NOT NULL, "cpf" character varying NOT NULL, "data_ingresso" date NOT NULL, "celular" character varying NOT NULL, CONSTRAINT "UQ_7d72b36d16642eb758366a072c1" UNIQUE ("cpf"), CONSTRAINT "PK_59b290e3568d6200112b91682ed" PRIMARY KEY ("aluno_id"))`);
        await queryRunner.query(`CREATE TABLE "etapa_inscricao" ("id" SERIAL NOT NULL, "nome" character varying NOT NULL, "ordem" integer NOT NULL, "data_inicio" date NOT NULL, "data_fim" date NOT NULL, "descricao" text, "editalId" integer, CONSTRAINT "PK_4a31674d149e935277165e7177c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "edital" ("id" SERIAL NOT NULL, "nome_edital" text NOT NULL, "descricao" text NOT NULL, "tipo_beneficio" text NOT NULL, "edital_url" text NOT NULL, "categoria_edital" text, "status_edital" text NOT NULL, "quantidade_bolsas" integer NOT NULL, CONSTRAINT "PK_521e2170c236167de6dc1e176f1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."documento_tipo_documento_enum" AS ENUM('Comprovante de situação cadastral do cpf', 'Cert. de conclusão ou Hist. escolar do ensino médio', 'Documento de Identidade', 'Comprovante de matrícula')`);
        await queryRunner.query(`CREATE TYPE "public"."documento_status_documento_enum" AS ENUM('Pendente', 'Aprovado', 'Reprovado', 'Em Análise')`);
        await queryRunner.query(`CREATE TABLE "documento" ("documento_id" SERIAL NOT NULL, "tipo_documento" "public"."documento_tipo_documento_enum" NOT NULL, "documento_url" character varying NOT NULL, "status_documento" "public"."documento_status_documento_enum" NOT NULL, "inscricaoInscricaoId" integer, CONSTRAINT "PK_9e5da115cf20260ba1b2d511d86" PRIMARY KEY ("documento_id"))`);
        await queryRunner.query(`CREATE TABLE "resposta" ("resposta_id" SERIAL NOT NULL, "resposta" character varying NOT NULL, "perguntaPerguntaId" integer, CONSTRAINT "PK_ea4098128e221dc22fb98ba2f04" PRIMARY KEY ("resposta_id"))`);
        await queryRunner.query(`CREATE TABLE "pergunta" ("pergunta_id" SERIAL NOT NULL, "pergunta" character varying NOT NULL, "formularioFormularioId" integer, CONSTRAINT "PK_5dbd352ce7befc5cfc2cb5f267c" PRIMARY KEY ("pergunta_id"))`);
        await queryRunner.query(`CREATE TABLE "formulario" ("formulario_id" SERIAL NOT NULL, "titulo_formulario" character varying NOT NULL, CONSTRAINT "PK_3f91c756a8cfb2afbd4b98e2007" PRIMARY KEY ("formulario_id"))`);
        await queryRunner.query(`CREATE TYPE "public"."inscricao_status_inscricao_enum" AS ENUM('Inscrição Negada', 'Inscrição Aprovada', 'Inscrição Pendente')`);
        await queryRunner.query(`CREATE TABLE "inscricao" ("inscricao_id" SERIAL NOT NULL, "data_inscricao" date NOT NULL, "status_inscricao" "public"."inscricao_status_inscricao_enum", "alunoAlunoId" integer, "editalId" integer, CONSTRAINT "PK_989c86adc44071ebe6372a44d81" PRIMARY KEY ("inscricao_id"))`);
        await queryRunner.query(`CREATE TYPE "public"."resultado_etapa_status_etapa_enum" AS ENUM('Etapa finalizada', 'Etapa em análise', 'Etapa não iniciada')`);
        await queryRunner.query(`CREATE TABLE "resultado_etapa" ("resultado_id" SERIAL NOT NULL, "status_etapa" "public"."resultado_etapa_status_etapa_enum" NOT NULL, "observacao" text, "data_avaliacao" date, "inscricaoInscricaoId" integer, "etapaId" integer, CONSTRAINT "PK_ace10e69cfcef4dc9a417cd9a35" PRIMARY KEY ("resultado_id"))`);
        await queryRunner.query(`CREATE TYPE "public"."validacao_status_enum" AS ENUM('Pendente', 'Aprovado', 'Reprovado', 'Em Análise')`);
        await queryRunner.query(`CREATE TABLE "validacao" ("id" SERIAL NOT NULL, "status" "public"."validacao_status_enum" NOT NULL, "parecer" text, "data_validacao" date, CONSTRAINT "PK_251178d66bc4f11f6d945c044d4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "etapa_inscricao" ADD CONSTRAINT "FK_5bfbdaefbbc120a8e183b88beb3" FOREIGN KEY ("editalId") REFERENCES "edital"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "documento" ADD CONSTRAINT "FK_b5c3f36f0fdabc13dfd267cc90a" FOREIGN KEY ("inscricaoInscricaoId") REFERENCES "inscricao"("inscricao_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "resposta" ADD CONSTRAINT "FK_2f813e8730022d0402140184ef3" FOREIGN KEY ("perguntaPerguntaId") REFERENCES "pergunta"("pergunta_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pergunta" ADD CONSTRAINT "FK_619b8b5647b475c0169ba6c18f4" FOREIGN KEY ("formularioFormularioId") REFERENCES "formulario"("formulario_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inscricao" ADD CONSTRAINT "FK_d6688bd0c3f0d1ba6b42978d6bd" FOREIGN KEY ("alunoAlunoId") REFERENCES "aluno"("aluno_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inscricao" ADD CONSTRAINT "FK_ca26b52c70a97fd8d3cf0ba7eff" FOREIGN KEY ("editalId") REFERENCES "edital"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "resultado_etapa" ADD CONSTRAINT "FK_4a97430812d6696366b88399a8f" FOREIGN KEY ("inscricaoInscricaoId") REFERENCES "inscricao"("inscricao_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "resultado_etapa" ADD CONSTRAINT "FK_477b382c55bc3960a091fba1946" FOREIGN KEY ("etapaId") REFERENCES "etapa_inscricao"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "resultado_etapa" DROP CONSTRAINT "FK_477b382c55bc3960a091fba1946"`);
        await queryRunner.query(`ALTER TABLE "resultado_etapa" DROP CONSTRAINT "FK_4a97430812d6696366b88399a8f"`);
        await queryRunner.query(`ALTER TABLE "inscricao" DROP CONSTRAINT "FK_ca26b52c70a97fd8d3cf0ba7eff"`);
        await queryRunner.query(`ALTER TABLE "inscricao" DROP CONSTRAINT "FK_d6688bd0c3f0d1ba6b42978d6bd"`);
        await queryRunner.query(`ALTER TABLE "pergunta" DROP CONSTRAINT "FK_619b8b5647b475c0169ba6c18f4"`);
        await queryRunner.query(`ALTER TABLE "resposta" DROP CONSTRAINT "FK_2f813e8730022d0402140184ef3"`);
        await queryRunner.query(`ALTER TABLE "documento" DROP CONSTRAINT "FK_b5c3f36f0fdabc13dfd267cc90a"`);
        await queryRunner.query(`ALTER TABLE "etapa_inscricao" DROP CONSTRAINT "FK_5bfbdaefbbc120a8e183b88beb3"`);
        await queryRunner.query(`DROP TABLE "validacao"`);
        await queryRunner.query(`DROP TYPE "public"."validacao_status_enum"`);
        await queryRunner.query(`DROP TABLE "resultado_etapa"`);
        await queryRunner.query(`DROP TYPE "public"."resultado_etapa_status_etapa_enum"`);
        await queryRunner.query(`DROP TABLE "inscricao"`);
        await queryRunner.query(`DROP TYPE "public"."inscricao_status_inscricao_enum"`);
        await queryRunner.query(`DROP TABLE "formulario"`);
        await queryRunner.query(`DROP TABLE "pergunta"`);
        await queryRunner.query(`DROP TABLE "resposta"`);
        await queryRunner.query(`DROP TABLE "documento"`);
        await queryRunner.query(`DROP TYPE "public"."documento_status_documento_enum"`);
        await queryRunner.query(`DROP TYPE "public"."documento_tipo_documento_enum"`);
        await queryRunner.query(`DROP TABLE "edital"`);
        await queryRunner.query(`DROP TABLE "etapa_inscricao"`);
        await queryRunner.query(`DROP TABLE "aluno"`);
        await queryRunner.query(`DROP TYPE "public"."aluno_campus_enum"`);
        await queryRunner.query(`DROP TYPE "public"."aluno_curso_enum"`);
        await queryRunner.query(`DROP TYPE "public"."aluno_pronome_enum"`);
    }

}
