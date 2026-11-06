# Validação da versão sem serviço de e-mail

Data: 06/11/2026. Alteração local posterior ao commit 83dcf4e. Não houve commit, push, deploy ou acesso ao Supabase nesta etapa. Os arquivos do TCC não foram alterados.

## Comportamento atual

- A aplicação não depende de SMTP, provedor de e-mail ou origem pública para gerar links.
- Consumidores entram após cadastro com e-mail e senha; varejistas e ONGs dependem de aprovação administrativa.
- Não há confirmação, reenvio, link de recuperação ou redefinição de senha por e-mail. Os quatro endpoints antigos retornam 404 e os links/telas foram removidos.
- O e-mail continua como login e permanece normalizado e único. Sua alteração exige senha atual, revoga a sessão anterior e permite novo login com o endereço atualizado.
- Troca de senha na conta autenticada continua exigindo senha atual e revogando sessões anteriores.
- MFA administrativo TOTP e códigos de recuperação do autenticador são mantidos. Esses códigos não redefinem uma senha esquecida.
- Cookie HttpOnly, CSRF, limites persistentes, auditoria, aprovação de organizações e armazenamento persistente de imagens foram preservados.
- Termos, privacidade do site, roteiro Railway, exemplo de variáveis e testes foram ajustados. O relatório de 04/11 foi identificado como histórico.

## Banco existente

Nenhuma migration foi alterada ou criada. O EF confirmou que não há alterações de modelo pendentes. EmailConfirmado e EmailsPendentes permanecem mapeados por compatibilidade com a migration já aplicada; a flag não autoriza nem bloqueia o acesso, não aparece no perfil da API e não é apresentada como verificação de titularidade. Não há código produtor de e-mails ou worker de envio. Rotinas de manutenção/exclusão continuam limpando dados legados quando cabível. Nenhuma tabela ou conta real foi removida.

## Verificação executada

| Verificação | Resultado |
| --- | --- |
| Build da API | 0 erros, 0 avisos |
| Lint e build frontend | aprovados; aviso de bundle acima de 500 kB |
| Regras de negócio | 38/38 |
| Conta/exclusão com SQLite | 20/20 |
| Administrador legado com SQLite | 13/13 |
| Segurança atualizada com SQLite | 43/43 |
| Segurança atualizada com PostgreSQL isolado | 43/43 |
| Playwright/Chrome com papel de banco restrito | 4/4 cenários |
| Modelo EF versus migration | sem mudanças pendentes |
| git diff --check | aprovado |

São 114 verificações de regras e serviços, com as 43 de segurança também executadas no PostgreSQL. O ambiente usou apenas loopback, banco vittaflow_seguranca e contas sintéticas @example.invalid. Não houve envio de mensagens, servidor SMTP falso ou conexão de teste com serviços externos.

Os cenários Playwright cobriram cadastro/login sem confirmação, ausência das opções de recuperação por e-mail, cookie/CSRF, permissão administrativa negada ao consumidor, endereço/imagem após reinício, troca de senha e de e-mail, revogação após logout/reinício, 404 nos endpoints removidos, MFA e recuperação do autenticador, limites persistentes e inicialização com ASPNETCORE_ENVIRONMENT=Production sem configuração de e-mail. A produção foi simulada localmente atrás de terminação TLS; não é um teste de deploy no Railway.

## Publicação

Esta retirada não exige nova migration. Email__* e Security__PublicOrigin podem ser removidas do Railway; são ignoradas por esta versão. Security__EncryptionKey permanece obrigatória para MFA e chaves CSRF. As demais etapas pendentes (armazenamento de imagens, papel/permissões de banco e demais variáveis) continuam no roteiro SEGURANCA.md. Ainda não houve push/deploy desta alteração. A revisão do TCC foi adiada a pedido do usuário.
