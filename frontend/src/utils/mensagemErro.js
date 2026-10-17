export const mensagemErro = (erro, padrao = 'Não foi possível concluir a operação.') =>
  erro.response?.data?.message ?? erro.response?.data?.erro ?? erro.response?.data?.Erro ?? padrao;
