# Publicação das alterações de segurança

Esta versão muda autenticação, esquema do banco e configuração de produção. Os arquivos estão preparados; as credenciais e o armazenamento devem ser configurados pelo responsável antes da publicação. Nenhuma mudança deste roteiro foi aplicada ao Supabase ou ao Railway automaticamente.

## O que mudou

- E-mails são normalizados e têm índice único; a migration interrompe se houver contas conflitantes, sem mesclá-las.
- O primeiro endereço de varejistas e ONGs passa a ser inserido corretamente.
- Login usa cookie HttpOnly; em produção, Secure, SameSite=Strict e prefixo __Host-. O JWT não é devolvido no JSON nem armazenado no localStorage.
- Toda mutação da API exige cookie e cabeçalho antifalsificação. O endpoint de relatórios CSP recebe apenas diagnóstico limitado e não altera contas.
- Sessões e revogações persistem no PostgreSQL. Troca de senha, alteração de e-mail e exclusão invalidam acessos anteriores. A implantação encerra sessões antigas que não têm registro no banco.
- Administradores configuram um autenticador TOTP no primeiro login e recebem dez códigos de recuperação de uso único. Um código de recuperação exige configurar novo autenticador antes de liberar o painel.
- Consumidores podem entrar após o cadastro; varejistas e ONGs precisam de aprovação administrativa. A senha pode ser trocada na conta autenticada mediante a senha atual. Segredos MFA permanecem cifrados.
- CPF e CNPJ têm dígitos verificadores validados; CNPJ numérico e alfanumérico são aceitos. Isso não comprova identidade ou regularidade cadastral: a aprovação de organizações continua necessária.
- Limites de tentativas por conta são persistentes. Há também limite de mutações por usuário/IP na instância, cabeçalhos de segurança, auditoria sem credenciais e inspeção operacional administrativa.
- Uploads em produção exigem Cloudinary ou volume persistente. Fotos já perdidas em containers anteriores precisam ser enviadas novamente.

## Antes de publicar

1. Execute `security/preflight.sql` no SQL Editor com credencial de manutenção. Resolva duplicidades manualmente após conferir a titularidade; não exclua contas apenas para permitir a migration. Confira discriminadores e hashes legados. Guarde a saída com acesso restrito.
2. Faça backup do banco e das imagens e ensaie a restauração em banco separado. Registre a chave `Security__EncryptionKey` em cofre separado do dump. Sem ela, MFA e chaves CSRF não podem ser recuperados.
3. Configure as variáveis do exemplo `railway.env.example`. Gere duas chaves aleatórias independentes: JWT (pelo menos 32 bytes de entropia) e cifragem (exatamente 32 bytes em Base64). Use um gerenciador de senhas; não publique valores no Git, chat, screenshots ou logs. A chave de cifragem deve ser estável entre reinícios e réplicas. Sua rotação exige migração criptográfica, não apenas substituir a variável.
4. Confira as variáveis obrigatórias em `railway.env.example`. O e-mail identifica a conta no login; a troca de senha é feita na conta autenticada, mediante a senha atual.
5. Configure as três credenciais do Cloudinary, ou remova as três e monte um volume no Railway, por exemplo `/data/vittaflow`, configurando `Storage__PersistentDirectory`. O diretório deve existir e permitir escrita do usuário `app` do container. `RAILWAY_VOLUME_MOUNT_PATH` também é reconhecido. Com volume, faça backup separado das imagens e respeite as limitações de réplicas do serviço; para escalar, prefira armazenamento compartilhado. Não use o disco efêmero do container.
6. Aplique a migration `20261104222051_SegurancaContasSessoes` com credencial de manutenção, antes da nova API. `security/migrar-seguranca.sql` é o script incremental idempotente a partir de `ContaPerfilNotificacoes`. Para base mais antiga, use `dotnet tool restore` e `dotnet ef database update --project api/TccSolidario.Api` com `ConnectionStrings__DefaultConnection` de manutenção em sessão privada. Não habilite migrations no runtime.
7. Execute `security/permissoes-supabase.sql` após as migrations. Ele prepara `vittaflow_app` sem login, sem DDL e sem propriedade das tabelas, habilita RLS nas tabelas do sistema e remove acessos diretos de `anon`, `authenticated` e `service_role` a elas. Habilite LOGIN e defina a senha do papel em sessão privada, por exemplo `\password vittaflow_app` no psql. Ajuste a conexão do runtime para o papel app no Session pooler. A credencial de manutenção permanece fora do Railway. Esse roteiro pressupõe projeto dedicado à VittaFlow e não modifica tabelas de outros sistemas.
8. Publique a versão com as variáveis prontas. A API recusa inicializar em produção com migrations pendentes, chave inválida ou armazenamento efêmero. `Database__SeedAdmin=false`; para criar o primeiro administrador, habilite seed somente uma vez com `AdminSettings__Email`, `AdminSettings__Nome` e `AdminSettings__SenhaPadrao`, depois desabilite-o e remova a senha de seed. Contas administrativas existentes não são recriadas.
9. Entre novamente, configure MFA administrativo e guarde os códigos fora do navegador. Valide consumidor, varejista e ONG, cadastro/endereço, troca de senha/e-mail, reserva/retirada, logout e fotos após reinício. O pagamento continua sendo acertado diretamente com o varejista.

A migration aplicada `SegurancaContasSessoes` deve permanecer íntegra. Mantenha a chave de cifragem estável e protegida: ela permite recuperar os segredos MFA e as chaves CSRF após reinícios e restaurações.

## Conexão, HTTPS e privilégios

Use os Host/User atuais de **Connect > Session pooler** do seu projeto Supabase. Use `SSL Mode=VerifyFull`; o Docker inclui a CA em `/app/certs/supabase-root.crt`. Não desabilite validação de certificado para resolver falhas de conexão. Atualize a CA se o provedor a trocar.

O Docker define `Proxy__HttpsTermination=true` para o Railway: o público acessa HTTPS e o transporte proxy/container é HTTP. Só utilize essa opção atrás desse limite confiável, sem expor a porta do container diretamente. Ela não confia em IP enviado pelo cliente. Para identificar IPs reais nos limites, configure apenas proxies/redes comprovadamente usados pela infraestrutura (`Proxy__KnownProxies__0` ou `Proxy__KnownNetworks__0`). Sem essa configuração o limite anônimo por IP pode agregar usuários atrás do proxy; o limite por conta permanece funcionando no banco. Para limites entre réplicas por IP e proteção volumétrica, configure também proteção no proxy/WAF.

Mantenha frontend e API na mesma origem, como no Docker. Cookies Strict não atendem automaticamente frontends em sites diferentes. CORS não substitui CSRF.

A autenticação dos usuários é da API .NET, não do Supabase Auth. A política RLS do papel `vittaflow_app` autoriza o backend; permissões entre consumidor/varejista/ONG/admin continuam nos controllers/services. Não use `auth.uid()` esperando reconhecer estes JWTs, nem exponha a senha do papel app ao frontend. Reaplique/revise grants e RLS para novas tabelas de futuras migrations. Confira que o papel não herdou permissões extras e não possui tabelas.

## Operação e alertas

- `/health/live`: processo responde. `/health`: conexão com banco. `/health/ready`: banco e último estado dos workers. Não revelam credenciais.
- `/api/admin/operacao`: requer sessão administrativa com MFA; mostra estados dos workers, sessões e auditoria recente.
- Configure no Railway/monitor externo alerta para indisponibilidade de `/health/ready`, reinícios recorrentes e erros de workers; configure também alerta para aumento de 401/429. O código fornece sinais, mas não cria regras na sua conta Railway nem envia alertas externos por si só.
- Comece com `Security__CspReportOnly=true`, exercite todos os fluxos e avalie relatórios `CSP: violação da diretiva ...`. Depois use `false` para bloquear violações. Testes locais de login, MFA e troca de senha usam CSP aplicada. Câmera/leitor de retirada e imagens externas devem ser validados no domínio definitivo.
- Logs não devem registrar corpos de login, senha/hash, cookie, token ou string de conexão. A auditoria registra ações/IDs, não valores anteriores. Retenção padrão: auditoria 180 dias (configurável entre 30 e 730), sessões/tokens expirados mais sete dias e limpeza de filas legadas conforme a rotina de manutenção. Defina retenção de logs externos e backups no provedor também.

## Backup e restauração

Instale clientes PostgreSQL compatíveis (pg_dump da mesma versão principal do servidor ou superior). Use `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGSSLMODE=verify-full`, `PGSSLROOTCERT` e `PGPASSFILE` privado; nunca passe senha em linha de comando. Execute:

```powershell
./deploy/security/backup.ps1 -OutputFile CAMINHO_PRIVADO/backup.dump
# Aponte PG* para um banco separado e vazio, nunca para a produção durante o ensaio:
./deploy/security/restore.ps1 -BackupFile CAMINHO_PRIVADO/backup.dump -ConfirmDatabase NOME_DO_BANCO_VAZIO
```

O script não apaga nem sobrescreve banco ou backup. O dump cobre somente o schema public da aplicação, sem schemas internos de Supabase Auth/Storage, roles/senhas do cluster ou imagens externas. Antes de restaurar em outro cluster, crie o papel sem login vittaflow_app (as políticas RLS o referenciam). Reaplique as permissões após restaurar. Backups completos do projeto Supabase devem ser configurados separadamente no provedor. Guarde o dump cifrado e a chave de aplicação em cofres separados, com acesso mínimo. Configure periodicidade, retenção e cópia externa no provedor; os scripts não criam um agendamento. Ensaie restauração periodicamente e após migrations relevantes, confira contagens, arquivos de imagem e acesso/MFA em ambiente isolado. SHA256 detecta corrupção acidental, não substitui assinatura/autenticidade e controle de acesso.

## Testes automatizados

`checks.yml` usa PostgreSQL descartável com dados `@example.invalid`; não acessa produção. Há verificações de regras, contas, legado, segurança e fluxos Playwright incluindo reinício. `migrate.yml` passou a execução manual com environment `production`; configure aprovação e `DB_MIGRATION_CONNECTION` nos secrets desse environment. O workflow não executa preflight, backup ou liberação automaticamente. Exija o job de testes nas regras da branch antes de merge; isso depende da configuração do GitHub.

Para executar os testes de navegador localmente: aplique migrations em PostgreSQL de teste loopback, defina `VITTAFLOW_TEST_CONNECTION` com Database começando `vittaflow_`, faça build com `VITE_API_URL=/api` e execute `npm run test:e2e` em `frontend`. Instale Chromium com `npx playwright install chromium`, ou defina `VITTAFLOW_TEST_CHROME` para seu Chrome. Os scripts recusam endereço de produção e usam portas locais 55187/55188.

Referências oficiais: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [papéis PostgreSQL](https://supabase.com/docs/guides/database/postgres/roles), [antiforgery ASP.NET Core](https://learn.microsoft.com/aspnet/core/security/anti-request-forgery?view=aspnetcore-8.0), [pg_dump](https://www.postgresql.org/docs/current/app-pgdump.html) e [pg_restore](https://www.postgresql.org/docs/current/app-pgrestore.html).

## Homologação

Use outro environment/projeto Railway com banco Supabase próprio e credenciais distintas. Não aponte homologação para produção. Configure outro domínio público e outro armazenamento, chaves JWT/cifragem independentes. Aplique as mesmas migrations e permissões. Use somente dados sintéticos ou anonimizados; não clone dados pessoais de produção para demonstração. A criação desses recursos na sua conta permanece uma etapa de infraestrutura descrita neste roteiro.

## Diagnóstico de envio de imagens

A partir desta correção, os logs registram `Cloudinary: upload recusado. HTTP N; categoria C.` sem a mensagem bruta do provedor. Credenciais, assinaturas e conteúdo dos arquivos não são registrados. A interface recebe uma orientação sem detalhes internos da infraestrutura. Categorias: `credenciais` (autenticação recusada), `ambiente` (ambiente não encontrado), `conta-desativada`, `permissao`, `limite`, `requisicao` (imagem/parâmetros recusados), `indisponivel`, `resposta-invalida`, `conexao` e `tempo-esgotado`. O status do log é o status externo do Cloudinary, não o HTTP 400 devolvido pelo controller ao navegador.

Confira que CloudName, ApiKey e ApiSecret pertencem ao mesmo ambiente e ao mesmo par de chaves ativo. Não confunda Key Name com Cloud name ou API Key. A inicialização valida presença, não testa as credenciais contra a rede. O código remove espaços nas extremidades dos três valores antes de construir o cliente.

O projeto `tests/TccSolidario.ImagensChecks` exercita o SDK real contra HTTP exclusivamente local e respostas simuladas, sem credenciais reais ou acesso ao Cloudinary. Foram verificadas recusas, ausência de URL, sucesso e proteção dos logs. Esses testes não comprovam que as credenciais de produção estejam corretas.

## Troca do usuário de banco na aplicação

Execute primeiro conferir-permissoes.sql, somente leitura, e confirme separadamente o Username usado pelo Railway. O usuário da sessão do SQL Editor não identifica o usuário da aplicação.

Com a aplicação ainda usando o proprietário postgres, execute permissoes-supabase.sql como proprietário. Ele mantém a propriedade das tabelas, prepara vittaflow_app sem login, concede CONNECT/USAGE e somente DML nas onze tabelas operacionais, habilita RLS nelas e remove os privilégios diretos dos papéis anon/authenticated/service_role. O histórico das migrations fica com RLS e política de SELECT para vittaflow_app, sem permissão de escrita. Isso evita que uma tabela de histórico com RLS previamente ativada pareça vazia ao runtime. O script não exclui registros e é transacional.

Depois configure uma senha forte exclusiva e habilite LOGIN para vittaflow_app em uma sessão privada de administração. No pgAdmin, use Login/Group Roles → vittaflow_app → Properties: Definition → Password; Privileges → Can login = Yes, mantendo Superuser/Create roles/Create databases/Bypass RLS desabilitados. Não salve a senha em arquivos versionados ou mensagens.

Antes de trocar a conexão do Railway, registre uma segunda conexão no pgAdmin com o mesmo Host e porta 5432 do Session pooler, Maintenance database postgres, Username vittaflow_app.REFERENCIA_DO_PROJETO e a senha própria desse papel. Alternativamente valide por psql com o mesmo usuário do pooler. Consulte `SELECT current_user;` e `SELECT count(*) FROM public."__EFMigrationsHistory";` e confirme que a migration de segurança é visível. Não basta testar SELECT sem confirmar o usuário efetivo. Mantenha a conexão administrativa separada para manutenção.

Somente após essa validação, substitua Username e Password da ConnectionStrings__DefaultConnection do Railway pelos do papel app, preservando Host, Port, Database e validação TLS. Aplique a alteração em deploy e confira /health/ready, login, dados da conta e uma operação própria. Se ocorrer erro, preserve logs sem segredos e restaure a conexão anterior enquanto o motivo é corrigido; não remova RLS para contornar falha.

Reexecute conferir-permissoes.sql após a mudança. O esperado é: papel app sem poderes administrativos, RLS ativada nas doze tabelas incluindo histórico, políticas restritas ao backend, sem privilégios diretos de anon/authenticated/service_role nas tabelas do sistema. Isso não substitui as permissões entre perfis verificadas pela API. Novas tabelas e funções de migrations futuras exigem nova revisão de RLS, grants e privilégios padrão do Supabase.
