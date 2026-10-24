// As URLs de imagem vêm relativas da API ("/uploads/..."): resolve contra o host da API.
const BASE_API = new URL(import.meta.env.VITE_API_URL || '/api', window.location.origin);

export const urlImagem = caminho => (caminho ? new URL(caminho, BASE_API).href : null);

// Lista de fotos na ordem de exibição (capa primeiro), aceitando o formato antigo de uma foto só.
export const fotosDoProduto = produto =>
  (produto.imagens?.length ? produto.imagens : [produto.imagemUrl].filter(Boolean)).map(urlImagem);

export const TIPOS_IMAGEM = ['image/jpeg', 'image/png', 'image/webp'];
export const TAMANHO_MAXIMO_IMAGEM = 5 * 1024 * 1024;
export const MAX_IMAGENS = 6;
