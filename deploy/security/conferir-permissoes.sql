-- Somente leitura. Execute no SQL Editor do projeto Supabase usado pelo Railway.
-- Uma única linha JSON facilita copiar o resultado completo.
-- Não consulta cadastros, senhas, hashes, cookies, tokens ou strings de conexão.
WITH tabelas AS (
    SELECT c.oid, c.relname AS nome, r.rolname AS proprietario, c.relrowsecurity AS rls,
           c.relforcerowsecurity AS rls_forcada
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    JOIN pg_roles r ON r.oid=c.relowner
    WHERE n.nspname='public' AND c.relkind IN ('r','p')
      AND c.relname IN ('Usuarios','Enderecos','Produtos','ProdutoImagens','Transacoes',
        'SessoesAutenticacao','TokensSeguranca','EmailsPendentes','EventosAuditoria',
        'ChavesProtecao','LimitesAutenticacao','__EFMigrationsHistory')
), papeis AS (
    SELECT rolname AS nome, rolcanlogin AS permite_login, rolsuper AS superusuario,
           rolcreatedb AS cria_banco, rolcreaterole AS cria_papel, rolbypassrls AS ignora_rls
    FROM pg_roles WHERE rolname IN ('vittaflow_app','anon','authenticated','service_role')
), privilegios AS (
    SELECT grantee AS papel, table_name AS tabela, privilege_type AS privilegio
    FROM information_schema.table_privileges
    WHERE table_schema='public' AND table_name IN (SELECT nome FROM tabelas)
      AND grantee IN ('PUBLIC','anon','authenticated','service_role','vittaflow_app')
), politicas AS (
    SELECT tablename AS tabela, policyname AS politica, roles AS papeis, cmd AS operacao
    FROM pg_policies WHERE schemaname='public' AND tablename IN (SELECT nome FROM tabelas)
), herancas AS (
    SELECT r.rolname AS papel_herdado FROM pg_auth_members m
    JOIN pg_roles r ON r.oid=m.roleid JOIN pg_roles u ON u.oid=m.member
    WHERE u.rolname='vittaflow_app'
)
SELECT jsonb_build_object(
    'usuario_sessao_editor', current_user,
    'migration_seguranca_aplicada', EXISTS (SELECT FROM public."__EFMigrationsHistory" WHERE "MigrationId"='20261104222051_SegurancaContasSessoes'),
    'tabelas', coalesce((SELECT jsonb_agg(to_jsonb(t) - 'oid' ORDER BY nome) FROM tabelas t), '[]'::jsonb),
    'papeis', coalesce((SELECT jsonb_agg(to_jsonb(p) ORDER BY nome) FROM papeis p), '[]'::jsonb),
    'privilegios', coalesce((SELECT jsonb_agg(to_jsonb(p) ORDER BY papel,tabela,privilegio) FROM privilegios p), '[]'::jsonb),
    'politicas', coalesce((SELECT jsonb_agg(to_jsonb(p) ORDER BY tabela,politica) FROM politicas p), '[]'::jsonb),
    'papeis_herdados_app', coalesce((SELECT jsonb_agg(papel_herdado ORDER BY papel_herdado) FROM herancas), '[]'::jsonb),
    'papel_app_pode_conectar', (SELECT has_database_privilege(oid, current_database(), 'CONNECT') FROM pg_roles WHERE rolname='vittaflow_app'),
    'funcao_normalizar_email_existe', to_regprocedure('public.vittaflow_normalizar_email()') IS NOT NULL
) AS diagnostico;
