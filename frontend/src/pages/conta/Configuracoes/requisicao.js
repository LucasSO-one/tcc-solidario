import { digitos } from '../../../utils/mascaras';

// PUT /api/conta recebe a conta inteira: cada seção envia os dados atuais + os campos que ela altera.
export function montarRequisicao(conta, alteracoes = {}) {
  return {
    nome: conta.nome,
    email: conta.email,
    telefone: digitos(conta.telefone),
    organizacao: conta.organizacao,
    endereco: conta.endereco,
    notificacoes: conta.notificacoes,
    ...alteracoes,
  };
}

// Erros do servidor vêm como { "organizacao.nomeFantasia": "..." }: guarda só o nome do campo.
export function errosDoServidor(erro, prefixo = '') {
  const erros = erro.response?.data?.erros;
  if (!erros) return null;
  return Object.fromEntries(Object.entries(erros)
    .filter(([campo]) => campo.startsWith(prefixo))
    .map(([campo, msg]) => [campo.slice(prefixo.length).replace(/^\./, ''), msg]));
}
