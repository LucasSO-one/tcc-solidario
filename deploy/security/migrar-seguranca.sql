START TRANSACTION;


DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261104222051_SegurancaContasSessoes') THEN
    LOCK TABLE "Usuarios" IN SHARE ROW EXCLUSIVE MODE;
    DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM "Usuarios" GROUP BY lower(btrim("Email")) HAVING count(*) > 1) THEN
            RAISE EXCEPTION 'Existem e-mails duplicados após normalização. Execute deploy/security/preflight.sql e resolva os cadastros antes de migrar.';
        END IF;
        IF EXISTS (SELECT 1 FROM "Usuarios" WHERE "Email" IS NULL OR length(btrim("Email")) NOT BETWEEN 3 AND 254) THEN
            RAISE EXCEPTION 'Existem e-mails vazios ou maiores que 254 caracteres. Corrija os registros antes de migrar.';
        END IF;
    END $$;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261104222051_SegurancaContasSessoes') THEN
    ALTER TABLE "Usuarios" ADD "CodigosRecuperacaoMfa" text NOT NULL DEFAULT '[]';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261104222051_SegurancaContasSessoes') THEN
    ALTER TABLE "Usuarios" ADD "EmailConfirmado" boolean NOT NULL DEFAULT TRUE;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261104222051_SegurancaContasSessoes') THEN
    ALTER TABLE "Usuarios" ADD "EmailNormalizado" character varying(254) NOT NULL DEFAULT '';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261104222051_SegurancaContasSessoes') THEN
    ALTER TABLE "Usuarios" ADD "MfaAtivo" boolean NOT NULL DEFAULT FALSE;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261104222051_SegurancaContasSessoes') THEN
    ALTER TABLE "Usuarios" ADD "SegredoMfaProtegido" text;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261104222051_SegurancaContasSessoes') THEN
    ALTER TABLE "Usuarios" ADD "UltimoPassoMfa" bigint NOT NULL DEFAULT -1;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261104222051_SegurancaContasSessoes') THEN
    ALTER TABLE "Usuarios" ADD "VersaoSeguranca" uuid NOT NULL DEFAULT (gen_random_uuid());
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261104222051_SegurancaContasSessoes') THEN
    CREATE TABLE "ChavesProtecao" (
        "Id" uuid NOT NULL,
        "XmlProtegido" text NOT NULL,
        CONSTRAINT "PK_ChavesProtecao" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261104222051_SegurancaContasSessoes') THEN
    CREATE TABLE "EmailsPendentes" (
        "Id" uuid NOT NULL,
        "UsuarioId" uuid NOT NULL,
        "Cancelado" boolean NOT NULL,
        "MensagemProtegida" text NOT NULL,
        "CriadoEmUtc" timestamp with time zone NOT NULL,
        "ExpiraEmUtc" timestamp with time zone NOT NULL,
        "ProximaTentativaUtc" timestamp with time zone NOT NULL,
        "EmProcessamentoAteUtc" timestamp with time zone,
        "EnviadoEmUtc" timestamp with time zone,
        "Tentativas" integer NOT NULL,
        CONSTRAINT "PK_EmailsPendentes" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_EmailsPendentes_Usuarios_UsuarioId" FOREIGN KEY ("UsuarioId") REFERENCES "Usuarios" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261104222051_SegurancaContasSessoes') THEN
    CREATE TABLE "EventosAuditoria" (
        "Id" uuid NOT NULL,
        "UsuarioId" uuid,
        "EntidadeId" uuid,
        "Acao" character varying(80) NOT NULL,
        "Sucesso" boolean NOT NULL,
        "EmUtc" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_EventosAuditoria" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261104222051_SegurancaContasSessoes') THEN
    CREATE TABLE "LimitesAutenticacao" (
        "Chave" character varying(64) NOT NULL,
        "InicioUtc" timestamp with time zone NOT NULL,
        "Tentativas" integer NOT NULL,
        CONSTRAINT "PK_LimitesAutenticacao" PRIMARY KEY ("Chave")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261104222051_SegurancaContasSessoes') THEN
    CREATE TABLE "SessoesAutenticacao" (
        "Id" uuid NOT NULL,
        "UsuarioId" uuid NOT NULL,
        "VersaoUsuario" uuid NOT NULL,
        "CriadaEmUtc" timestamp with time zone NOT NULL,
        "ExpiraEmUtc" timestamp with time zone NOT NULL,
        "RevogadaEmUtc" timestamp with time zone,
        CONSTRAINT "PK_SessoesAutenticacao" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_SessoesAutenticacao_Usuarios_UsuarioId" FOREIGN KEY ("UsuarioId") REFERENCES "Usuarios" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261104222051_SegurancaContasSessoes') THEN
    CREATE TABLE "TokensSeguranca" (
        "Hash" character varying(64) NOT NULL,
        "UsuarioId" uuid NOT NULL,
        "VersaoUsuario" uuid NOT NULL,
        "Finalidade" character varying(32) NOT NULL,
        "ExpiraEmUtc" timestamp with time zone NOT NULL,
        "ConsumidoEmUtc" timestamp with time zone,
        "Falhas" integer NOT NULL,
        "SegredoProtegido" text,
        CONSTRAINT "PK_TokensSeguranca" PRIMARY KEY ("Hash"),
        CONSTRAINT "FK_TokensSeguranca_Usuarios_UsuarioId" FOREIGN KEY ("UsuarioId") REFERENCES "Usuarios" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261104222051_SegurancaContasSessoes') THEN
    UPDATE "Usuarios" SET "EmailNormalizado" = lower(btrim("Email"));
    CREATE OR REPLACE FUNCTION public.vittaflow_normalizar_email() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN NEW."EmailNormalizado" := lower(btrim(NEW."Email")); RETURN NEW; END $$;
    CREATE TRIGGER vittaflow_email_normalizado BEFORE INSERT OR UPDATE OF "Email" ON "Usuarios"
    FOR EACH ROW EXECUTE FUNCTION public.vittaflow_normalizar_email();
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261104222051_SegurancaContasSessoes') THEN
    CREATE UNIQUE INDEX "IX_Usuarios_EmailNormalizado" ON "Usuarios" ("EmailNormalizado");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261104222051_SegurancaContasSessoes') THEN
    CREATE INDEX "IX_EmailsPendentes_EnviadoEmUtc_ProximaTentativaUtc" ON "EmailsPendentes" ("EnviadoEmUtc", "ProximaTentativaUtc");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261104222051_SegurancaContasSessoes') THEN
    CREATE INDEX "IX_EmailsPendentes_UsuarioId" ON "EmailsPendentes" ("UsuarioId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261104222051_SegurancaContasSessoes') THEN
    CREATE INDEX "IX_EventosAuditoria_EmUtc" ON "EventosAuditoria" ("EmUtc");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261104222051_SegurancaContasSessoes') THEN
    CREATE INDEX "IX_SessoesAutenticacao_UsuarioId_ExpiraEmUtc" ON "SessoesAutenticacao" ("UsuarioId", "ExpiraEmUtc");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261104222051_SegurancaContasSessoes') THEN
    CREATE INDEX "IX_TokensSeguranca_UsuarioId_Finalidade" ON "TokensSeguranca" ("UsuarioId", "Finalidade");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261104222051_SegurancaContasSessoes') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20261104222051_SegurancaContasSessoes', '8.0.33');
    END IF;
END $EF$;
COMMIT;
