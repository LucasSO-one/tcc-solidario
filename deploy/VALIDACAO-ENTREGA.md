# Validação da entrega

Data: 09/11/2026. Base revisada: commit a2a5bce, acompanhado dos ajustes locais descritos abaixo. Domínio verificado: https://vittaflow.up.railway.app. Este relatório distingue os testes da versão publicada dos ajustes ainda locais. Não foi feito commit, push ou deploy nesta revisão.

## Ajustes locais

- Cadastro de ONG passa a implementar IValidatableObject, executando a validação e normalização do celular que antes não era chamada pela API.
- Diagnóstico de CNPJ é restrito ao administrador. O serviço recusa documentos inválidos antes da consulta externa; foi eliminada a aprovação especial de números repetidos. Falhas de rede, respostas inválidas e situação cadastral ausente não aprovam o documento. A consulta não foi integrada automaticamente ao cadastro institucional.
- Logs dessa consulta não registram o CNPJ, a razão social ou a mensagem bruta do provedor.
- Dezesseis verificações de cadastro foram acrescentadas à integração contínua, além de dois cenários de regressão pela API em execução.
- O relatório específico solicitado foi excluído e suas referências foram atualizadas. O documento de operação descreve a configuração atual.
- O TCC foi revisado em cópia do Word fornecido em 09/11. O original foi preservado. As figuras existentes continuam identificadas como protótipos; não foram substituídas por capturas supostamente reais.

## Verificações locais

| Verificação | Resultado |
| --- | --- |
| Regras de negócio | 38/38 |
| Contas e exclusão | 20/20 |
| Compatibilidade legada | 13/13 |
| Segurança com SQLite | 43/43 |
| Imagens com SDK e HTTP local simulado | 30/30 |
| Cadastro, consulta cadastral e autorização | 16/16 |
| Segurança repetida no PostgreSQL 18 isolado | 43/43 |
| Navegador com PostgreSQL e papel restrito | 8/8 cenários |
| Compilação da API e publicação Release | aprovadas |
| Lint e build de produção do frontend | aprovados |
| Modelo EF versus última migration | nenhuma mudança pendente |
| Auditoria npm | zero vulnerabilidades informadas |
| Auditoria NuGet incluindo transitivas | nenhuma vulnerabilidade informada |
| Backup e restauração isolados | aprovados |
| git diff --check | aprovado |

São 160 verificações distintas de regras/serviços/cadastro. As 43 de segurança foram repetidas em PostgreSQL e não foram somadas novamente a esse total. Os oito cenários de navegador incluem testes via interface e requisições HTTP ao servidor local. Não são uma medição de cobertura de linhas.

O PostgreSQL isolado usa loopback e bancos vittaflow_entrega e vittaflow_restore. O ensaio de backup validou catálogo e checksum, restaurou em banco vazio, reaplicou permissões/RLS e comparou contagens de usuários, produtos, transações e migrations. Não leu nem restaurou o Supabase de produção. Não demonstra a existência de agendamento de backups na hospedagem.

## Produção

Foram aprovadas 55 verificações HTTP com dados sintéticos. Elas abrangeram páginas públicas, endpoints de saúde, consultas de vitrine e ofertas, cadastro de consumidor, recusa de organizações pendentes, login após aprovação feita pelo proprietário, restrições de perfil, CSRF, upload e leitura de imagem real no Cloudinary, reserva, exclusividade, cancelamento, confirmação, código de uso único, doação automática no cadastro dentro da janela de 24 horas, prévia bloqueada e antecipação de doação.

Foi recusada a leitura de lote por outro varejista, a confirmação de retirada por varejista não proprietário, o cancelamento de reserva alheia pela ONG e a reserva de doação por consumidor. O envio da fotografia de perfil também foi aprovado. Foram verificadas ainda dez navegações reais no Chrome: página inicial, login, cadastro, termos e privacidade, em desktop e celular. Todas responderam HTTP 200, sem erros JavaScript ou transbordamento horizontal nos tamanhos verificados.

O segundo fator administrativo foi automatizado somente no ambiente isolado. A aprovação em produção foi feita pelo usuário no painel. Não foi contornado o MFA nem alterado o papel de terceiros. A expiração temporal em seus limites foi verificada por testes locais com relógio controlado; não houve espera de duas horas ou alteração do relógio/banco de produção.

Os testes HTTP não constituem teste de carga, auditoria independente de segurança, avaliação de acessibilidade ou estudo de campo. Os novos ajustes locais precisam de commit/push/deploy para alterar o site publicado. Eles não exigem migration.

## Dados sintéticos e limpeza

O conjunto QA-20261109-f79797 teve suas quatro contas excluídas pela própria API, com descaracterização cadastral e revogação de acesso. O lote de prévia foi removido e não restou reserva ativa desse conjunto. Dois lotes concluídos foram preservados por regra do sistema:

- Venda: fbb88319-f755-4829-bc39-55acc0541fd8.
- Doação: d64dab2d-32cb-4e4c-8425-586192b05c5e.

Esses registros representam uma confirmação técnica com uma unidade por lote, sem entrega física, venda ou doação real. Não devem compor evidências de impacto do TCC. Os indicadores administrativos podem incluir históricos sintéticos; qualquer apresentação deve distinguir testes de atividade real. O histórico sintético de verificações anteriores também deve ser tratado dessa maneira.

O primeiro conjunto QA-20261109-3194fd verificou cadastro, restrição de acesso e login, mas o continuador do roteiro falhou. Ele não criou lotes nem reservas. Seus cadastros foram mantidos identificados como TESTE QA; o bloqueio das três organizações foi solicitado ao proprietário e não foi verificado automaticamente. Não se declara que esses quatro registros foram excluídos.

## Pendências de operação e alcance acadêmico

O fluxo central testado está operacional. Permanecem dependentes de configuração nas contas dos provedores: frequência e retenção de backup protegido, cópia externa, alertas de indisponibilidade e tratamento dos relatórios CSP. Preserve a chave de cifragem e os códigos MFA em local protegido. O repositório fornece sinais e roteiros; não cria esses serviços externos automaticamente.

Descontos progressivos sugeridos, fluxo documental institucional, reputação e comprovante final com proteção específica continuam requisitos futuros no TCC. Usabilidade, desempenho sob carga e efeitos sociais/econômicos exigem estudos próprios. Não se afirma que o projeto está integralmente validado ou que todos os requisitos acadêmicos foram implementados.
