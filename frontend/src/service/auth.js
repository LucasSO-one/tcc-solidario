// service/auth.js
import api from '../config/api';

const ENDPOINTS_REGISTRO = {
  consumidor: '/registro/consumidor',
  ong: '/registro/ong',
  varejista: '/registro/varejista',
};

const apenasDigitos = (valor = '') => valor.replace(/\D/g, '');

// Monta o payload no formato exato que cada DTO do backend espera
function montarPayloadRegistro(userType, formData) {
  const base = { email: formData.email, senha: formData.senha };

  switch (userType) {
    case 'consumidor':
      return {
        ...base,
        nome: formData.nome,
        cpf: apenasDigitos(formData.cpf),
        telefone: formData.telefone, // mantém a máscara, o backend exige o formato
      };
    case 'ong':
      return {
        ...base,
        nomeFantasia: formData.nomeFantasia,
        cnpj: apenasDigitos(formData.cnpj),
        telefone: formData.telefone,
      };
    case 'varejista':
      return {
        ...base,
        razaoSocial: formData.razaoSocial,
        cnpj: apenasDigitos(formData.cnpj),
      };
    default:
      throw new Error('Tipo de usuário inválido.');
  }
}

export async function register(userType, formData) {
  const endpoint = ENDPOINTS_REGISTRO[userType];
  if (!endpoint) throw new Error('Tipo de usuário inválido.');

  const payload = montarPayloadRegistro(userType, formData);
  const { data } = await api.post(endpoint, payload);
  return data;
}

export async function login({ email, senha }) {
  const { data } = await api.post('/auth/login', { email, senha });
  return data;
}