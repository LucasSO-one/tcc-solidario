import api from '../config/api';

export async function listarUsuarios() {
  const { data } = await api.get('/Admin/usuarios');
  return data;
}

export async function listarCadastros(status) {
  const { data } = await api.get('/Admin/cadastros', { params: status ? { status } : {} });
  return data;
}

export async function avaliarCadastro(id, novoStatus) {
  const { data } = await api.put(`/Admin/avaliar-cadastro/${id}`, { novoStatus });
  return data;
}
