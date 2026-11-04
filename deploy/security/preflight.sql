-- Somente leitura. Execute como manutenção antes da migration de segurança.
-- O resultado contém e-mails/identificadores: não publique a saída.
SELECT lower(btrim("Email")) AS email_normalizado, count(*) AS quantidade,
       array_agg("Id") AS ids
FROM public."Usuarios"
GROUP BY lower(btrim("Email")) HAVING count(*) > 1;

SELECT "Id", "Email", "Tipo", "TipoUsuarioString", "StatusAprovacao"
FROM public."Usuarios"
WHERE "Email" IS NULL OR length(btrim("Email")) NOT BETWEEN 3 AND 254
   OR "TipoUsuarioString" NOT IN ('Admin','Consumidor','Varejista','Ong');

-- Diagnóstico de hash, nunca o hash em si.
SELECT "Id", length("SenhaHash") AS tamanho_hash,
       "SenhaHash" ~ '^\$2[aby]\$[0-9]{2}\$[./A-Za-z0-9]{53}$' AS formato_bcrypt
FROM public."Usuarios"
WHERE NOT ("SenhaHash" ~ '^\$2[aby]\$[0-9]{2}\$[./A-Za-z0-9]{53}$');

SELECT "MigrationId" FROM public."__EFMigrationsHistory" ORDER BY "MigrationId";
