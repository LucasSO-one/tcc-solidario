# Etapa operacional — 09/11/2026

Base: commit 6afdf211, com alterações locais desta etapa ainda sem commit/deploy.
Nenhuma migration, classificação de QA, troca de credencial ou teste de carga foi executado
no Supabase/Railway nesta etapa. O TCC não foi alterado.

## Situação dos seis itens

| Item | Entrega nesta etapa | Para concluir no ambiente publicado |
|---|---|---|
| Backup periódico | Scripts age, restauração testada, modelo diário com retenção de 14 dias e limite de 8 MiB | Criar repositório privado separado, configurar secrets, executar e restaurar o primeiro backup real |
| Monitoramento e alertas | Mantidos os endpoints e o painel operacional | Alertas externos dispensados expressamente pelo responsável; acompanhamento manual |
| CSP | Padrão obrigatório, fonte embutida corrigida, verificação pelo navegador | Publicar e definir Security__CspReportOnly=false no Railway |
| Dados de QA | Campos internos, filtros em todos os perfis, script para QA próprio conhecido | Aplicar migration e executar classificação no banco de produção |
| Credenciais e recuperação | Responsável confirmou troca das senhas e guarda da chave e códigos MFA | Confirmação declarada pelo responsável; valores não inspecionados nem copiados |
| Validação adicional | Automação de acessibilidade, carga local e protocolo de usabilidade | Aplicar avaliação manual/com participantes; não há resultados humanos nesta etapa |

## Publicar sem iniciar com schema antigo

1. Faça um backup novo do banco atual e mantenha acesso à cópia anterior.
2. No SQL Editor do Supabase, como manutenção, execute
   `deploy/security/migration-separacao-qa.sql`.
   Este SQL acrescenta dois campos booleanos com padrão false e registra
   `20261110004927_SeparacaoDadosTeste`. O identificador usa o relógio UTC.
   O código anterior continua compatível; não é preciso derrubar o site para acrescentar os campos.
3. Execute `deploy/security/classificar-qa-conhecido.sql` e anote as contagens retornadas.
   O script só marca os quatro lotes cujos UUIDs foram registrados nos nossos roteiros,
   suas lojas e os quatro cadastros exatos do primeiro roteiro de 09/11.
   Não apaga transações, não identifica terceiros por relacionamento com esses lotes
   e não bloqueia logins. QA marcado fica fora dos indicadores.
   A exclusão/ocultação de lotes em catálogo não faz parte dessa marcação.
4. Confira o diff, faça commit e push. Aguarde o Railway concluir o deploy.
   Não faça push deste backend antes do passo 2: ele exige o novo schema.
5. No Railway, defina `Security__CspReportOnly=false`.
   Uma variável já existente com true prevalece sobre o novo padrão do código.
6. Verifique `/health/ready`, login dos perfis, imagens, reserva/retirada e relatório.
   A Home deve responder com Content-Security-Policy, sem o sufixo Report-Only.
   Use F12 para verificar violações nas ações com CEP, fotos e QR no site publicado.
   A política permite o próprio site, Cloudinary para imagens, ViaCEP para conexão
   e câmera somente no próprio site. Mantenha a alternativa de digitar código.
7. Ative o backup conforme `deploy/backup-privado/README.md`.
   O modelo não roda automaticamente no repositório público do aplicativo.
8. Registre a avaliação com participantes conforme `deploy/AVALIACAO-USABILIDADE.md`.

A migração é aditiva. Se precisar voltar ao código anterior, mantenha as colunas;
não execute Down em produção para fazer rollback do aplicativo.

## Dados sintéticos futuros

EhDadoTeste não é um campo aceito pelos formulários públicos de cadastro.
Uma loja marcada transmite a classificação aos lotes novos. Os relatórios também excluem
transações com produto, loja, consumidor ou ONG marcados. Não basta escrever “TESTE”
no nome para obter a classificação. Use um banco de homologação para próximos roteiros;
se excepcionalmente usar produção, registre os UUIDs e marque só os seus registros com manutenção.

Contas reais excluídas deixam o total de cadastros vigentes. Suas retiradas históricas
continuam nos indicadores, salvo marcação explícita de QA. As chaves JSON legadas
alimentosSalvos foram mantidas por compatibilidade; na interface, o rótulo agora informa
unidades com retirada confirmada, sem inferir causalidade sobre desperdício real.

## Evidência de validação

O relatório desta etapa deve distinguir regressão do backend, cenários de navegador,
varredura automática WCAG e carga local. Uma varredura sem achados não comprova
conformidade integral. A carga local tem apenas 20 lotes, 8 leituras simultâneas
e 120 respostas, sem rede externa nem imagens de produção; não é teste de capacidade
máxima, concorrência de reservas ou SLA do Railway.

Backup: um dump real do PostgreSQL local foi cifrado, decifrado e restaurado em outro banco
vazio. Foram verificadas 12 migrations restauradas, rejeição de sobrescrita e limite de tamanho.
A configuração remota do agendamento e uma restauração de dados de produção continuam pendentes.

Fontes: [age](https://github.com/FiloSottile/age),
[GitHub Actions e cobrança](https://docs.github.com/en/billing/concepts/product-billing/github-actions),
[acessibilidade no Playwright](https://playwright.dev/docs/accessibility-testing).

### Resultados obtidos

- Backend: 173 verificações aprovadas (38 regras, 20 contas, 13 legado,
  30 imagens, 16 cadastro, 13 indicadores/CSP e 43 segurança em PostgreSQL).
- Playwright: 13 cenários aprovados; aplicação real, PostgreSQL local e papel
  vittaflow_app com RLS. Acessibilidade automática em 25 páginas distintas
  (5 públicas, 7 varejista, 5 ONG, 4 consumidor e 4 administrador após MFA).
- Páginas públicas verificadas também em largura móvel de 390 px e navegação
  pelo atalho de teclado para o conteúdo. CSP sem violações observadas no
  carregamento das páginas públicas testadas.
- Carga local na rodada completa: 120 respostas, 8 requisições simultâneas,
  20 lotes cadastrados pela API e removidos ao final; zero falhas,
  p50 49,07 ms, p95 225,97 ms e máximo 369,00 ms.
- Build frontend, lint, publicação Release, modelo sem alterações pendentes,
  npm audit e NuGet aprovados; nenhuma vulnerabilidade conhecida retornada.
- Backup cifrado/restaurado em PostgreSQL local vazio: 12 migrations presentes.
  Limite de tamanho e preservação de backup existente verificados.
- SQL de classificação executado no PostgreSQL local; sem registros de produção
  nessa base, retornou zero lotes e zero contas correspondentes. Classificação
  real em produção ainda deve ser executada e conferida pelo responsável.
- SQL idempotente da migration reexecutado com sucesso na cópia local restaurada.
- Produção, consulta somente de leitura ao final da etapa: Home e /health/ready
  HTTP 200; CSP ainda em Report-Only, conforme configuração atual do Railway.

Correções decorrentes dos testes: contraste de textos secundários e logo,
links em parágrafos sublinhados, título principal visível no celular e arquivos
fontes servidos pela própria origem, sem data: bloqueado pela CSP.

Para repetir localmente: use VITE_API_URL=/api no build, configure o banco
vittaflow_* em loopback e VITTAFLOW_TEST_USE_LIMITED_ROLE=true. O servidor
Playwright impede usar uma conexão de produção. O código de carga não aceita
URL remota; não execute testes de carga contra o site publicado sem um plano específico.


## Atualização de operação — 10/11/2026

O responsável confirmou a aplicação da migration e a publicação do código.
A classificação no Supabase retornou 4 lotes e 6 contas QA.
As avaliações com participantes reais foram dispensadas pelo responsável; não há
resultados humanos de usabilidade a acrescentar. Os alertas externos permanecem fora do escopo.

Backup automático ativado em repositório privado separado do código do aplicativo:
agendamento diário às 06:23 UTC (03:23 em Brasília), retenção de 14 dias,
criptografia age, limite de 8 MiB por cópia e TLS verify-full com a CA oficial Supabase.
A primeira cópia válida foi concluída em 10/11/2026, baixada, conferida por checksum,
decifrada e restaurada em banco local vazio. Foram verificadas 12 tabelas, 12 migrations,
4 lotes QA, 6 contas QA e a leitura pelo papel de runtime restrito.
O banco temporário de validação foi removido depois dos testes; as cópias retidas são cifradas.
A chave privada de restauração permanece fora do Git. É necessária uma segunda cópia
segura dessa chave. A verificação feita cobre o schema public, não a recuperação completa
de infraestrutura, imagens Cloudinary e segredos de aplicação.
