# Avaliação com participantes — roteiro a executar

Situação: protocolo preparado; nenhum resultado humano foi coletado nesta etapa.
Testes automáticos e cadastros de QA não substituem participantes independentes.

Use ambiente de homologação com dados fictícios, autorização dos participantes e
contas por perfil. Não registre documentos, senhas, códigos MFA ou outros dados pessoais
na planilha de observações. Identifique participantes como P01, P02 etc.
Uma rodada inicial pode reunir 3 consumidores, 1 varejista e 1 representante de ONG;
isso é uma amostra exploratória, sem representatividade estatística.

## Sessão individual, aproximadamente 20 minutos

Apresente o propósito geral da plataforma, sem explicar onde clicar. O observador
registra acertos, dificuldades e comentários; oferece ajuda apenas quando solicitada.
Interrompa se a pessoa não quiser continuar. Nenhuma compra ou entrega física é necessária.

| Perfil | Tarefa | Critério observável |
|---|---|---|
| Todos | Explicar o propósito após visitar a Home | Entende quem participa e a retirada no estabelecimento |
| Consumidor | Comparar Ofertas e Vitrine; reservar um lote | Diferencia destaque e catálogo; encontra sua reserva e o prazo |
| Consumidor | Cancelar uma reserva | Localiza a ação e confirma o cancelamento |
| Varejista | Cadastrar lote com foto, preço e validade | Lote fica visível com os dados esperados |
| Varejista | Confirmar a retirada de uma reserva de teste | Usa o código e reconhece o estado concluído |
| ONG | Encontrar e reservar uma doação | Diferencia doação de venda e encontra o código de retirada |
| Todos | Alterar a foto e localizar termos/privacidade | Consegue concluir e identificar as páginas |
| Todos | Navegar por teclado e usar zoom 200% | Encontra foco visível, controles e texto legível |

Cada pessoa executa apenas as tarefas do seu perfil.
Depois, peça nota de facilidade de 1 (muito difícil) a 5 (muito fácil), por tarefa,
e pergunte: “O que mais confundiu?” e “O que você mudaria primeiro?”.

## Registro a preencher

| Participante | Perfil | Dispositivo | Tarefa | Concluiu sem ajuda? | Tempo | Ajuda/erros | Facilidade 1–5 | Comentário |
|---|---|---|---|---|---|---|---|---|
| | | | | | | | | |

Não preencher com valores simulados. Relate quantidade de participantes, datas,
contexto, limitações e tarefas de fato realizadas. Separe o que foi observado do que
foi interpretado. Corrija os problemas recorrentes e repita as tarefas afetadas.

## Acessibilidade manual complementar

Além do scanner automático WCAG, conferir ordem de foco, mensagens dinâmicas por
leitor de tela, formulário com erro, modal de reserva, zoom/refluxo, contraste sobre
fotografias, uso do leitor de QR com alternativa de digitar código e experiência móvel.
Registre navegador e tecnologia assistiva usados. Scanner sem achados não comprova
conformidade integral WCAG.

Referência: [limites dos testes automáticos, Playwright](https://playwright.dev/docs/accessibility-testing).
