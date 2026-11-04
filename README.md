# TCC Solidário

## Sobre o Projeto

O TCC Solidário é uma plataforma digital desenvolvida com o objetivo de reduzir o desperdício de alimentos, conectando comércios que possuem excedentes alimentares a consumidores e instituições que podem utilizá-los.

A proposta do sistema é transformar alimentos que seriam descartados em oportunidades de consumo com desconto ou doação, promovendo impacto econômico, social e ambiental.

---

## Objetivo

O principal objetivo da plataforma é reduzir o desperdício de alimentos por meio de uma solução tecnológica que permita:

* A comercialização de produtos próximos da data de validade com preços reduzidos
* A destinação de alimentos não vendidos para doação
* A conexão entre comércios, consumidores e organizações sociais

---

## Problema

Atualmente, uma grande quantidade de alimentos próprios para consumo é descartada diariamente por estabelecimentos como supermercados, padarias, restaurantes e produtores.

Esse desperdício ocorre principalmente devido a fatores como proximidade da data de validade, excesso de produção e exigências estéticas dos produtos.

Ao mesmo tempo, muitas pessoas enfrentam dificuldades no acesso a alimentos, evidenciando um problema social relevante.

---

## Solução Proposta

A plataforma propõe uma solução baseada na gestão inteligente de alimentos excedentes, permitindo que comércios:

* Cadastrem produtos não vendidos
* Apliquem descontos com base na proximidade da validade
* Disponibilizem itens para venda ou doação

Os consumidores podem visualizar e adquirir produtos com preços reduzidos, enquanto instituições podem acessar alimentos disponíveis para doação.

---

## Usuários da Plataforma

O sistema contempla três perfis principais de usuários:

Comércios
Supermercados, restaurantes, padarias e produtores responsáveis pelo cadastro e disponibilização dos alimentos.

Consumidores
Usuários interessados em adquirir produtos com desconto e reduzir custos no consumo.

Instituições
Organizações sociais que podem solicitar alimentos disponíveis para doação.

---

## Funcionalidades Principais

* Cadastro de alimentos excedentes
* Precificação dinâmica baseada na validade
* Visualização de produtos disponíveis para compra
* Sistema de doação para instituições
* Rastreabilidade dos alimentos
* Painel com indicadores e métricas da plataforma

---

## Impacto Esperado

A plataforma busca gerar impacto nas seguintes dimensões:

Ambiental
Redução do desperdício de alimentos.

Econômico
Aproveitamento de produtos que seriam descartados, gerando valor para os comércios.

Social
Ampliação do acesso a alimentos por meio de preços reduzidos e doações.

---

## Tecnologias Utilizadas

Backend: C# / .NET
Frontend: React
Banco de Dados: PostgreSQL

---

## Status do Projeto

Projeto em desenvolvimento como Trabalho de Conclusão de Curso.



## Exclusão de conta e páginas públicas

- Termos de uso: `/termos`; política de privacidade: `/privacidade`. As duas rotas são públicas e estão ligadas ao cadastro e ao rodapé.
- Contato padrão: `lucas.silva2014outbook@gmail.com`. Pode ser substituído com `VITE_CONTATO_PRIVACIDADE` no ambiente do frontend.
- Em Configurações > Segurança, a exclusão exige a senha atual e a palavra `EXCLUIR`. A API usa `DELETE /api/conta`, com corpo JSON `{ "senhaAtual": "...", "confirmacao": "EXCLUIR" }`; o titular vem do JWT.
- Reservas ainda ativas impedem a exclusão (HTTP 409). Reservas já expiradas são encerradas. O último administrador aprovado também é protegido.
- O cadastro é encerrado com `StatusAprovacao.Excluido` (valor 4, na coluna já existente). Dados de perfil e endereços são removidos ou substituídos; as chaves e o histórico operacional permanecem. Isso não apaga automaticamente anúncios, seus arquivos, logs ou backups. A política informa esse limite.
- A verificação do usuário no banco a cada JWT bloqueia também as sessões já emitidas. Não há migração de esquema nova nem aplicação de migração em banco real nesta alteração.
- No PostgreSQL, transações com advisory lock serializam a exclusão, as alterações de perfil, a publicação de lotes e a criação de reservas para evitar corrida entre exclusão e novas operações. É uma proteção para o protótipo; o teste SQLite abaixo não valida concorrência PostgreSQL.

Verificação isolada, sem acessar o banco configurado da aplicação:

```sh
dotnet run --project tests/TccSolidario.ContaChecks
npm --prefix frontend run build
npm --prefix frontend run lint
```

As verificações de conta usam SQLite em memória e não leem configurações ou credenciais do banco da aplicação. Falhas na limpeza da foto após o encerramento da conta não desfazem a exclusão e podem exigir remoção pelo responsável pelo armazenamento.

## Deploy no Railway + Supabase

Consulte [o passo a passo de publicação](deploy/RAILWAY.md). O Dockerfile da raiz publica frontend e API em um serviço, com banco Supabase existente e configurações pelas Variables do Railway. Migrações e seed ficam desligados em produção.
