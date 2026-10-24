import { useEffect, useId, useRef, useState } from 'react';
import { ImagePlus, Star, X } from 'lucide-react';
import { MAX_IMAGENS, TAMANHO_MAXIMO_IMAGEM, TIPOS_IMAGEM } from '../../utils/imagens';
import './SeletorImagens.scss';

let proximoId = 0;

/**
 * Seleção de até 6 fotos com prévia, remoção individual e escolha da capa (a primeira por padrão).
 * `fotos` é uma lista de { id, arquivo, url }; a capa é sempre fotos[0].
 */
export default function SeletorImagens({ fotos, onChange }) {
  const inputRef = useRef(null);
  const fotosRef = useRef(fotos);
  const ajudaId = useId();
  const [erros, setErros] = useState([]);
  const [arrastando, setArrastando] = useState(false);

  useEffect(() => { fotosRef.current = fotos; }, [fotos]);
  // Libera as prévias da memória ao sair da tela
  useEffect(() => () => fotosRef.current.forEach(f => URL.revokeObjectURL(f.url)), []);

  function adicionar(lista) {
    const novos = [];
    const problemas = [];
    for (const arquivo of lista) {
      if (!TIPOS_IMAGEM.includes(arquivo.type)) problemas.push(`"${arquivo.name}" não é JPG, PNG ou WEBP.`);
      else if (arquivo.size > TAMANHO_MAXIMO_IMAGEM) problemas.push(`"${arquivo.name}" tem mais de 5 MB.`);
      else if (fotos.length + novos.length >= MAX_IMAGENS) { problemas.push(`Limite de ${MAX_IMAGENS} fotos atingido.`); break; }
      else novos.push({ id: ++proximoId, arquivo, url: URL.createObjectURL(arquivo) });
    }
    setErros(problemas);
    if (novos.length) onChange([...fotos, ...novos]);
  }

  function remover(id) {
    const foto = fotos.find(f => f.id === id);
    if (foto) URL.revokeObjectURL(foto.url);
    onChange(fotos.filter(f => f.id !== id));
    setErros([]);
  }

  function definirCapa(id) {
    const foto = fotos.find(f => f.id === id);
    onChange([foto, ...fotos.filter(f => f.id !== id)]);
  }

  return <div className="seletor-imagens">
    <input ref={inputRef} type="file" accept={TIPOS_IMAGEM.join(',')} multiple hidden
      onChange={e => { adicionar([...e.target.files]); e.target.value = ''; }} />
    {fotos.length < MAX_IMAGENS && <button type="button" aria-describedby={ajudaId}
      className={`seletor-imagens__zona${arrastando ? ' seletor-imagens__zona--ativa' : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setArrastando(true); }}
      onDragLeave={() => setArrastando(false)}
      onDrop={e => { e.preventDefault(); setArrastando(false); adicionar([...e.dataTransfer.files]); }}>
      <ImagePlus aria-hidden="true" />
      <span><strong>Adicionar fotos</strong> ou arraste e solte aqui</span>
    </button>}
    <p className="field__help" id={ajudaId}>
      Até {MAX_IMAGENS} fotos em JPG, PNG ou WEBP, com no máximo 5 MB cada. {fotos.length}/{MAX_IMAGENS} selecionadas.
    </p>
    {erros.map(e => <p key={e} className="field__error" role="alert">{e}</p>)}
    {fotos.length > 0 && <ul className="seletor-imagens__lista">
      {fotos.map((foto, i) => <li key={foto.id} className={`seletor-imagens__item${i === 0 ? ' seletor-imagens__item--capa' : ''}`}>
        <img src={foto.url} alt={`Prévia ${i + 1}: ${foto.arquivo.name}`} />
        {i === 0 ? <span className="seletor-imagens__selo"><Star aria-hidden="true" />Capa</span>
          : <button type="button" className="seletor-imagens__capa" onClick={() => definirCapa(foto.id)}
            aria-label={`Usar ${foto.arquivo.name} como capa`}><Star aria-hidden="true" />Usar como capa</button>}
        <button type="button" className="seletor-imagens__remover" onClick={() => remover(foto.id)}
          aria-label={`Remover ${foto.arquivo.name}`}><X /></button>
      </li>)}
    </ul>}
  </div>;
}
