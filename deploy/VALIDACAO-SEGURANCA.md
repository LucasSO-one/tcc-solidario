> Relatório histórico de 04/11/2026. Para o comportamento atual e as verificações mais recentes, consulte VALIDACAO-ENTREGA.md e SEGURANCA.md.

# Validação das alterações de segurança

Data: 04/11/2026. Implementação local em `tccSolidario`. Não houve push, deploy ou alteração no Supabase nesta etapa.

## Resultados

| Verificação | Resultado |
| --- | --- |
| Build da API em Release | 0 erros e 0 avisos |
| Lint e build do frontend | aprovados; aviso de bundle JavaScript acima de 500 kB |
| Regras de negócio sem banco | 38/38 |
| Conta/exclusão em SQLite isolado | 20/20 |
| Compatibilidade de administrador legado em SQLite | 13/13 |
| Novas verificações de segurança em SQLite | 43/43 |
| Novas verificações de segurança em PostgreSQL local isolado | 43/43 |
| Cenários completos Playwright/Chrome | 4/4, também com a API usando o papel restrito vittaflow_app |
| Auditoria NuGet, incluindo transitivas | nenhuma vulnerabilidade conhecida reportada |
| npm audit, incluindo desenvolvimento | nenhuma vulnerabilidade conhecida reportada |
| Compatibilidade entre modelo EF e migration | sem alterações pendentes de modelo |
| RLS e permissões | 11 tabelas protegidas; backend lê/grava sem DDL, TRUNCATE ou alteração do histórico de migrations |
| Acesso direto anon/authenticated às tabelas sensíveis | negado por privilégios |
| Backup e restauração em banco local separado | 12 tabelas idênticas por contagem e checksum do conteúdo integral |
| git diff --check | aprovado |

As 114 verificações de regras/serviços são executáveis com falha por código de saída, sem runner xUnit/MSTest. As 43 verificações novas foram repetidas no PostgreSQL. Elas não representam 157 regras distintas. Os quatro cenários Playwright incluem várias asserções HTTP e de interface.

## Cenários de navegador

1. Cadastro real no banco local, CPF inválido, confirmação de e-mail capturada por SMTP local, link de uso único, login sem distinguir maiúsculas, cookie HttpOnly, ausência de JWT no localStorage, consumidor sem permissão administrativa, unicidade, primeiro endereço e upload/releitura da foto após reiniciar a API.
2. Troca de senha e recuperação pela interface, resposta genérica para conta inexistente, invalidação das sessões anteriores, senha antiga recusada, link não reutilizável e logout mantido após reinício.
3. Primeiro acesso administrativo exige MFA, senha sozinha não autoriza painel, dez códigos de recuperação, recadastro do autenticador após recuperação, inspeção operacional e limite de tentativas mantido após reinício.
4. Configuração Production atrás de proxy de terminação TLS: antiforgery funciona, cookies de sessão e CSRF têm prefixo __Host-, Secure/HttpOnly/SameSite=Strict, sessão é aceita pelo backend, HSTS é emitido e relatórios CSP malformados não provocam erro 500. O transporte do ensaio é local HTTP entre proxy simulado e API; não é um teste do certificado do domínio Railway.

## Banco e infraestrutura

Foi usado somente PostgreSQL em loopback na porta 55439, com bancos vittaflow_* e fixtures @example.invalid. Nenhuma senha ou token de produção foi necessário. O SMTP dos testes captura mensagens localmente e não entrega e-mails a terceiros. Os testes não devem ser executados contra produção.

A migration nova foi aplicada ao PostgreSQL local; o script incremental idempotente e o preflight estão em `deploy/security`. Não foram mescladas ou removidas contas reais. Os scripts de RLS/permissões foram executados e reexecutados no banco de teste. O ensaio de restauração preservou conteúdo, sessões, segredos cifrados, chaves e histórico das migrations em um banco separado e vazio, sem limpeza ou sobrescrita do banco de origem.

O workflow CI e o workflow manual de migration foram preparados, mas não executados no GitHub nesta etapa. O build Docker final e a infraestrutura externa não foram executados/configurados aqui. As verificações de API/frontend foram feitas diretamente nos runtimes locais.

## Etapas externas antes do deploy

Siga `deploy/SEGURANCA.md`: preflight e backup de produção; SMTP/remetente verificado; chave de cifragem estável; Cloudinary ou volume; migration; papel restrito; variáveis no Railway; primeiro login/MFA; configuração de alertas, retenção, backups periódicos e homologação separada. O mecanismo de persistência de fotos foi validado com volume local; credenciais e entrega real do Cloudinary/SMTP permanecem dependentes da configuração do provedor.

Credenciais já expostas na conversa/screenshot devem ser substituídas pelo responsável em seus provedores. Valores antigos não foram reutilizados nem reproduzidos nestes arquivos.

O relatório anterior de testes em produção continua sendo um registro histórico. Seus dois eventos sintéticos de venda/doação preservados não se tornam impacto social real e não foram alterados nesta implementação.

Os testes não constituem auditoria completa, teste de carga, certificação de segurança ou validação jurídica da política de privacidade.
