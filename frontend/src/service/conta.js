import api from '../config/api';

export async function obterConta() {
  const { data } = await api.get('/conta');
  return data;
}

export async function atualizarConta(dados) {
  const { data } = await api.put('/conta', dados);
  return data;
}

export async function alterarSenha(senhaAtual, novaSenha) {
  await api.put('/conta/senha', { senhaAtual, novaSenha });
}

export async function enviarFoto(arquivo) {
  const formData = new FormData();
  formData.append('foto', arquivo);
  const { data } = await api.post('/conta/foto', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  return data.fotoUrl;
}

export async function listarTiposEstabelecimento() {
  const { data } = await api.get('/conta/tipos-estabelecimento');
  return data;
}

// Busca de endereço pelo CEP (ViaCEP, serviço público). Retorna null se o CEP não existir.
export async function buscarCep(cep) {
  const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
  if (!resposta.ok) throw new Error('Não foi possível consultar o CEP agora.');
  const dados = await resposta.json();
  return dados.erro ? null : { rua: dados.logradouro, bairro: dados.bairro, cidade: dados.localidade, estado: dados.uf };
}
