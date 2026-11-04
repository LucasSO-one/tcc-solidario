-- Executar APÓS as migrations, com o proprietário das tabelas.
-- A API usa autenticação própria; este papel representa o backend inteiro.
-- Não conceder este papel a anon, authenticated, authenticator ou clientes.
BEGIN;
DO $$ BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'vittaflow_app') THEN
        CREATE ROLE vittaflow_app NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE
            NOINHERIT NOREPLICATION NOBYPASSRLS;
    END IF;
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'vittaflow_app'
        AND (rolsuper OR rolcreatedb OR rolcreaterole OR rolreplication OR rolbypassrls))
        OR EXISTS (SELECT FROM pg_auth_members m JOIN pg_roles r ON r.oid=m.member WHERE r.rolname='vittaflow_app') THEN
        RAISE EXCEPTION 'Papel vittaflow_app existente possui privilégios elevados ou herança. Revisar antes de continuar.';
    END IF;
END $$;
GRANT USAGE ON SCHEMA public TO vittaflow_app;
-- Em um projeto exclusivo desta API, public não deve conceder criação a todos.
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON public."__EFMigrationsHistory" FROM PUBLIC, vittaflow_app;
GRANT SELECT ON public."__EFMigrationsHistory" TO vittaflow_app;

DO $$
DECLARE tabela text; papel text;
BEGIN
    FOREACH tabela IN ARRAY ARRAY['Usuarios','Enderecos','Produtos','ProdutoImagens','Transacoes',
        'SessoesAutenticacao','TokensSeguranca','EmailsPendentes','EventosAuditoria','ChavesProtecao','LimitesAutenticacao']
    LOOP
        IF to_regclass(format('public.%I', tabela)) IS NULL THEN
            RAISE EXCEPTION 'Tabela % ausente. Aplique as migrations antes.', tabela;
        END IF;
        IF EXISTS (SELECT FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
            JOIN pg_roles r ON r.oid=c.relowner WHERE n.nspname='public' AND c.relname=tabela AND r.rolname='vittaflow_app') THEN
            RAISE EXCEPTION 'Papel da API não pode ser proprietário de %.', tabela;
        END IF;
        EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC, vittaflow_app', tabela);
        FOREACH papel IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
            IF EXISTS (SELECT FROM pg_roles WHERE rolname=papel) THEN
                EXECUTE format('REVOKE ALL ON TABLE public.%I FROM %I', tabela, papel);
            END IF;
        END LOOP;
        EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO vittaflow_app', tabela);
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tabela);
        EXECUTE format('DROP POLICY IF EXISTS vittaflow_backend ON public.%I', tabela);
        EXECUTE format('CREATE POLICY vittaflow_backend ON public.%I FOR ALL TO vittaflow_app USING (true) WITH CHECK (true)', tabela);
    END LOOP;
    FOREACH papel IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
        IF EXISTS (SELECT FROM pg_roles WHERE rolname=papel) THEN
            EXECUTE format('REVOKE ALL ON TABLE public."__EFMigrationsHistory" FROM %I', papel);
        END IF;
    END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.vittaflow_normalizar_email() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.vittaflow_normalizar_email() TO vittaflow_app;
COMMIT;

-- Depois, em sessão privada de manutenção, habilite LOGIN e defina senha forte
-- pelo gerenciador de segredos/\password do psql. Nunca incluir senha neste arquivo.
-- Connection string do Session pooler: usuário vittaflow_app.REFERENCIA_DO_PROJETO.
-- Migrations continuam usando a credencial de manutenção, fora do runtime Railway.
-- Cada migration futura deve revisar grants/RLS; não há grants automáticos gerais.
