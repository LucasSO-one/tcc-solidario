// service/produto.js
import api from '../config/api';

// Monta o FormData no formato que o CadastrarLoteRequest espera (multipart, por causa da imagem)
function montarFormDataCadastrarLote(form) {
  const dataHoraValidade = new Date(
    `${form.dataValidade}T${form.horaValidade}`
  ).toISOString();

  const formData = new FormData();
  formData.append('Nome', form.nome);
  formData.append('Categoria', form.categoria);
  formData.append('Descricao', form.descricao );
  formData.append('Quantidade', form.quantidade);
  formData.append('DataValidade', dataHoraValidade);
  formData.append('PrecoOriginal', form.precoOriginal);
  formData.append('IsOferta', form.isOferta);
  if (form.precoDesconto) {
    formData.append('PrecoDesconto', form.precoDesconto);
  }
  formData.append('FrutaFeia', form.frutaFeia);
  if (form.imagem) {
    formData.append('Imagem', form.imagem);
  }

  return formData;
}

export async function cadastrarLote(form) {
  const formData = montarFormDataCadastrarLote(form);

  const { data } = await api.post('/produtos/cadastrar-lote', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return data;
}

export async function listarMeusProdutos() {
  const { data } = await api.get('/produtos/produtos');
  return data;
}

export const listarVitrine = async ({ busca = '', apenasFrutasFeias = false, signal } = {}) => {
  const { data } = await api.get('/produtos/vitrine', {
    params: { busca: busca || undefined, apenasFrutasFeias },
    signal,
  })
  return data
}

export const listarOfertas = async ({ busca = '', signal } = {}) => {
  const { data } = await api.get('/produtos/ofertas', {
    params: {
      busca: busca || undefined,
    },
    signal,
  })

  return data
}