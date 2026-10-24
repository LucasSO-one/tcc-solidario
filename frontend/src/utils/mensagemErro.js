// Extrai a mensagem de erro da API, em qualquer um dos formatos que ela devolve:
// { message }, { erro } / { Erro } (middleware) ou ProblemDetails de validação { errors: { Campo: ["..."] } }.
export const mensagemErro = (erro, padrao = 'Não foi possível concluir a operação.') => {
  const dados = erro.response?.data;
  const validacao = dados?.errors && Object.values(dados.errors).flat()[0];
  return dados?.message ?? dados?.erro ?? dados?.Erro ?? validacao ?? padrao;
};
