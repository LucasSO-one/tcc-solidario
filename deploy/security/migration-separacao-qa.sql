-- Aplicar com manutenção após backup. Compatível com o site anterior.
-- Exige a migration SegurancaContasSessoes já aplicada.
START TRANSACTION;


DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261110004927_SeparacaoDadosTeste') THEN
    ALTER TABLE "Usuarios" ADD "EhDadoTeste" boolean NOT NULL DEFAULT FALSE;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261110004927_SeparacaoDadosTeste') THEN
    ALTER TABLE "Produtos" ADD "EhDadoTeste" boolean NOT NULL DEFAULT FALSE;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20261110004927_SeparacaoDadosTeste') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20261110004927_SeparacaoDadosTeste', '8.0.33');
    END IF;
END $EF$;
COMMIT;

