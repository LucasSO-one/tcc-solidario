// Máscaras de exibição. O backend recebe e guarda apenas os dígitos.
export const digitos = valor => (valor ?? '').replace(/\D/g, '');

export function mascaraTelefone(valor) {
  const d = digitos(valor).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function mascaraCep(valor) {
  const d = digitos(valor).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

export function mascaraCpf(valor) {
  const d = digitos(valor).slice(0, 11);
  return d.replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1-$2');
}

export function mascaraCnpj(valor) {
  const d = digitos(valor).slice(0, 14);
  return d.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2');
}

// Mesma regra do backend (RegrasSenha.cs)
export const REQUISITOS_SENHA = [
  ['Pelo menos 8 caracteres', s => s.length >= 8],
  ['Uma letra maiúscula', s => /[A-Z]/.test(s)],
  ['Um número', s => /\d/.test(s)],
  ['Um caractere especial (ex.: @ # !)', s => /[\W_]/.test(s)],
];
export const senhaValida = senha => REQUISITOS_SENHA.every(([, teste]) => teste(senha));
