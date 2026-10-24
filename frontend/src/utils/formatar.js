// Formatação padrão de datas e valores da interface (pt-BR).
const FORMATO_DATA_HORA = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
const FORMATO_DATA = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' });
const FORMATO_MOEDA = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const dataHora = valor => FORMATO_DATA_HORA.format(new Date(valor));
export const dataCurta = valor => FORMATO_DATA.format(new Date(valor));
export const moeda = valor => FORMATO_MOEDA.format(Number(valor));

// Iniciais para o avatar: "Mercado Bom Preço" → "MB"; "ana.souza@x.com" → "AS"
export function iniciais(texto) {
  const palavras = (texto || '?').split('@')[0].split(/[\s._-]+/).filter(Boolean);
  const letras = palavras.length > 1 ? palavras[0][0] + palavras[1][0] : (palavras[0] ?? '?').slice(0, 2);
  return letras.toUpperCase();
}
