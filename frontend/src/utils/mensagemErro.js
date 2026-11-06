// Aceita erros por campo do middleware (erros) e ProblemDetails do ASP.NET (errors).
export function errosDeValidacao(erro) {
  const dados = erro.response?.data;
  const campos = dados?.erros ?? dados?.errors;
  if (!campos || typeof campos !== 'object') return {};
  return Object.fromEntries(Object.entries(campos).flatMap(([campo, mensagens]) => {
    const mensagem = (Array.isArray(mensagens) ? mensagens : [mensagens])
      .find(valor => typeof valor === 'string' && valor.trim());
    const nome = campo.charAt(0).toLowerCase() + campo.slice(1);
    return mensagem ? [[nome, mensagem]] : [];
  }));
}

export const mensagemErro = (erro, padrao = 'Não foi possível concluir a operação.') => {
  const dados = erro.response?.data;
  const validacao = Object.values(errosDeValidacao(erro))[0];
  return validacao ?? dados?.message ?? dados?.erro ?? dados?.Erro ?? padrao;
};
