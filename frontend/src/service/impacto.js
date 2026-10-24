import api from '../config/api';

// { indicadores: { chave: número }, evolucao: [{ mes: 'AAAA-MM', doadas, vendidas }] }
export async function obterImpacto() {
  const { data } = await api.get('/impacto');
  return data;
}
