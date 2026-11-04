> **Versão com segurança de contas:** leia primeiro [SEGURANCA.md](SEGURANCA.md) e o exemplo atualizado de variáveis. As novas configurações de SMTP, cifragem e armazenamento e a migration são obrigatórias antes de publicar.

# Deploy no Railway com banco existente no Supabase

## Arquitetura

Um serviço Railway compila React e .NET pelo Dockerfile da raiz. A API serve o site e as rotas `/api` no mesmo domínio. O banco continua no Supabase e as imagens devem usar o Cloudinary. Não crie um PostgreSQL adicional no Railway.

## 1. Publicar os arquivos no GitHub

Faça commit dos arquivos de deploy e das alterações associadas e envie para a branch que será conectada ao Railway. Não inclua senhas, `.env` ou `appsettings.json`. O Docker também exclui essas configurações locais; as configurações reais vêm das Variables.

## 2. Obter a conexão do Supabase

No projeto Supabase, abra **Connect** e selecione **Session pooler**. Copie host, usuário, banco e porta exibidos. O host normalmente termina em `.pooler.supabase.com`, o usuário é `postgres.REFERENCIA` e a porta é `5432`. Use exatamente os valores do seu painel.

Monte a string Npgsql no Railway, sem os colchetes dos exemplos:

```text
Host=HOST_DO_PAINEL;Port=5432;Database=postgres;Username=USUARIO_DO_PAINEL;Password=SENHA_DO_BANCO;SSL Mode=VerifyFull;Pooling=true;Maximum Pool Size=10;Timeout=15
```

É a senha do banco PostgreSQL, não a senha de login do Supabase. Não use a URL da API Supabase, anon key ou service_role key. A API .NET faz a conexão PostgreSQL e mantém sua autenticação JWT atual.

Se a senha contiver ponto e vírgula ou aspas, use a sintaxe de escape de connection strings Npgsql (valor entre aspas e aspas internas duplicadas). Não aplique URL encoding a esta string `Host=...`.

Session pooler é compatível com IPv4 e adequado para este serviço persistente. Não troque por transaction pooler/porta 6543 neste primeiro deploy. TLS usa VerifyFull. O Docker inclui a CA pública do Supabase e define `PGSSLROOTCERT=/app/certs/supabase-root.crt` para o Npgsql validar a cadeia. Não é necessário criar essa variável manualmente no Railway; se já existir um valor manual para `PGSSLROOTCERT`, ele precisa apontar para esse caminho. Não desative a validação do certificado se ocorrer erro.

## 3. Criar o serviço Railway

1. No Railway, **New Project > Deploy from GitHub repo** e escolha `LucasSO-one/tcc-solidario`.
2. Selecione a branch com os novos arquivos. Mantenha **Root Directory** na raiz do repositório. Não use `/frontend` ou `/api` nesta configuração integrada.
3. O `railway.toml` seleciona o Dockerfile da raiz e a verificação `/health`. Não defina comandos de build ou start manuais.
4. Em **Variables**, configure os valores de `deploy/railway.env.example`, substituindo todos os exemplos. Se um deploy automático começar antes disso, configure as variáveis e faça um novo deploy.

Variáveis obrigatórias:

| Nome | Valor |
| --- | --- |
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| `ConnectionStrings__DefaultConnection` | String Npgsql montada acima |
| `Jwt__Key` | Chave aleatória, secreta, com pelo menos 32 bytes; prefira 64 caracteres ASCII aleatórios |
| `Jwt__Issuer` | `TccSolidario` |
| `Jwt__Audience` | `TccSolidario` |
| `Database__AutoMigrate` | `false` |
| `Database__SeedAdmin` | `false` |
| `DadosTeste__Ativo` | `false` |
| `Cloudinary__CloudName` | Cloud name existente |
| `Cloudinary__ApiKey` | API key existente |
| `Cloudinary__ApiSecret` | API secret existente |

O banco já contém as tabelas sincronizadas pelas migrations; mantenha migrações e seed desligados. O login usa as contas já existentes. Uma chave JWT nova exige novo login, mas não muda senhas do banco.

Não é necessário configurar `VITE_API_URL`: o Docker compila com `/api`. Não coloque credenciais de banco, JWT ou Cloudinary em variáveis `VITE_`, pois elas são públicas no navegador. `VITE_CONTATO_PRIVACIDADE` é opcional e altera apenas o contato público durante o build.

Sem Cloudinary, o sistema usa arquivos locais do container. Esses arquivos não são persistentes entre deploys; por isso configure as três variáveis para manter as novas fotos. Imagens antigas que estejam apenas no computador não são transferidas para a nuvem por este deploy.

## 4. Publicar o domínio e conferir

Após configurar as variáveis e concluir o deploy, abra **Settings > Networking > Public Networking > Generate Domain**. Use a porta indicada pelo Railway; a API escuta o `PORT` fornecido automaticamente. Se configurar uma porta manual, use o mesmo valor no serviço e no domínio. Sem `PORT`, a imagem escuta em 8080.

Confira:

- `/health`: HTTP 200 com `{"status":"ok"}` confirma conectividade com o banco. Não confirma a versão do esquema; essa continua sendo a das migrations já aplicadas.
- `/`, `/login`, `/termos` e `/privacidade`: abrem normalmente, inclusive ao atualizar diretamente uma rota do React.
- Login com conta existente e consulta da vitrine.
- Cadastro de imagem: a URL deve começar com `https://res.cloudinary.com/` quando usar Cloudinary.

Os workers de validade e expiração retomam as regras normais e podem atualizar registros vencidos no banco quando o serviço iniciar. A configuração não migra nem replica dados; o site usa diretamente o Supabase informado.

Para este primeiro deploy, mantenha uma réplica e o serviço ativo, pois os workers dependem do processo em execução e a lista de logout ainda reside em memória. Reiniciar o processo perde essa lista; a exclusão de conta permanece bloqueada pelo cadastro no banco.

## Diagnóstico

- Healthcheck 503: confira host, usuário completo do pooler, senha, disponibilidade do projeto Supabase e eventuais restrições de rede.
- Erro de tabela/coluna inexistente: confira se a conexão aponta para o mesmo banco que recebeu as migrations. Não ative migrações às cegas.
- Build tenta encontrar arquivos em outra pasta: Root Directory deve ser a raiz.
- Foto desaparece após novo deploy: confirme Cloudinary e se a foto antiga era apenas um arquivo local.
- Página não abre: confirme deploy saudável, domínio e porta de destino.

## Referências oficiais

- [Railway: Dockerfiles](https://docs.railway.com/builds/dockerfiles)
- [Railway: variáveis](https://docs.railway.com/variables)
- [Railway: domínio público](https://docs.railway.com/networking/public-networking)
- [Supabase: conexão PostgreSQL](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Npgsql: TLS e certificados](https://www.npgsql.org/doc/security.html)

### Falha no handshake SSL

Se o log mostrar `Exception while performing SSL handshake` e `remote certificate was rejected`, confirme que o deploy usa o Dockerfile atualizado com `deploy/certs/supabase-root.crt`. Imagens anteriores não incluíam essa raiz. Faça commit e push desses arquivos e publique uma nova imagem, mantendo `SSL Mode=VerifyFull`. Reiniciar a imagem antiga não adiciona o certificado.

O arquivo é público e não contém senha. A sua procedência e impressão digital estão em `deploy/certs/README.md`. Para uma execução local fora do Docker, use `Root Certificate=CAMINHO_ABSOLUTO_DO_CERTIFICADO` na conexão ou defina `PGSSLROOTCERT` no ambiente local.

### Administrador antigo com identificador `admin`

A inicialização normaliza `TipoUsuarioString=admin` para `Admin` apenas quando `Tipo` já indica administrador (`99`, `Admin` ou `admin`). Preserva IDs, senhas e aprovação; não cria nem exclui contas. É uma correção pontual de compatibilidade executada antes do seed, independente de `Database__AutoMigrate` e `Database__SeedAdmin`. Em caso de correção, o log informa a quantidade normalizada. O usuário do banco precisa da permissão UPDATE em Usuarios já utilizada na edição de conta.
