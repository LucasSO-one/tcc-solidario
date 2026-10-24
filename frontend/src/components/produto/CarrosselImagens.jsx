import { useCallback, useEffect, useRef, useState } from 'react';
import { Apple, Beef, ChevronLeft, ChevronRight, Croissant, CupSoda, Ham, Milk, Snowflake, Soup, Wheat, Carrot } from 'lucide-react';
import './CarrosselImagens.scss';

const ICONE_CATEGORIA = {
  Padaria: Croissant, Hortifruti: Carrot, 'Laticínios': Milk, Mercearia: Wheat, Congelados: Snowflake,
  Carnes: Beef, Frios: Ham, Bebidas: CupSoda, 'Refeições': Soup,
};
const DURACAO = 420; // $duration-slow
const easeInOut = p => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2); // ≈ $ease-in-out
const reduzMovimento = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Carrossel de fotos: CSS scroll-snap (swipe nativo no toque) + estado React.
 * Setas e pontos animam o deslize com a mesma curva e duração do design system.
 */
export default function CarrosselImagens({ imagens, alt, categoria, variante = 'card', indiceInicial = 0, onAbrir, autoFocus = false }) {
  const trackRef = useRef(null);
  const animacao = useRef(0);
  const [indice, setIndice] = useState(indiceInicial);
  const total = imagens.length;

  useEffect(() => {
    const track = trackRef.current;
    if (track && indiceInicial) track.scrollLeft = indiceInicial * track.clientWidth;
    return () => cancelAnimationFrame(animacao.current);
  }, [indiceInicial]);

  const irPara = useCallback(alvo => {
    const track = trackRef.current;
    if (!track) return;
    const i = Math.max(0, Math.min(total - 1, alvo));
    const inicio = track.scrollLeft;
    const destino = i * track.clientWidth;
    setIndice(i);
    cancelAnimationFrame(animacao.current);
    if (reduzMovimento() || inicio === destino) { track.scrollLeft = destino; return; }
    track.classList.add('carrossel__track--animando'); // desliga o snap durante a animação
    const t0 = performance.now();
    const passo = agora => {
      const p = Math.min(1, (agora - t0) / DURACAO);
      track.scrollLeft = inicio + (destino - inicio) * easeInOut(p);
      if (p < 1) animacao.current = requestAnimationFrame(passo);
      else track.classList.remove('carrossel__track--animando');
    };
    animacao.current = requestAnimationFrame(passo);
  }, [total]);

  function aoRolar() {
    const track = trackRef.current;
    if (track.classList.contains('carrossel__track--animando')) return;
    const atual = Math.round(track.scrollLeft / track.clientWidth);
    if (atual !== indice) setIndice(atual);
  }

  function aoTeclar(e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); irPara(indice + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); irPara(indice - 1); }
  }

  if (!total) {
    const Icone = ICONE_CATEGORIA[categoria] ?? Apple;
    return <div className={`carrossel carrossel--${variante} carrossel--vazio`} role="img" aria-label={`${alt}: sem foto`}>
      <Icone aria-hidden="true" />
    </div>;
  }

  // autoFocus: dentro de um Modal, o carrossel recebe o foco inicial (o Modal procura [data-autofocus])
  return <div className={`carrossel carrossel--${variante}`} role="region" aria-roledescription="carrossel" data-autofocus={autoFocus || undefined}
    aria-label={`Fotos de ${alt}`} tabIndex={total > 1 ? 0 : undefined} onKeyDown={total > 1 ? aoTeclar : undefined}>
    <div ref={trackRef} className="carrossel__track" onScroll={aoRolar}>
      {imagens.map((src, i) => {
        const img = <img src={src} alt={total > 1 ? `${alt}, foto ${i + 1} de ${total}` : alt} draggable="false"
          loading={i === 0 || Math.abs(i - indice) <= 1 ? 'eager' : 'lazy'} decoding="async" />;
        return <div className="carrossel__slide" key={src + i} aria-hidden={i !== indice}>
          {onAbrir ? <button type="button" className="carrossel__ampliar" tabIndex={i === indice ? 0 : -1}
            aria-label={`Ampliar foto ${i + 1} de ${total}`} onClick={() => onAbrir(i)}>{img}</button> : img}
        </div>;
      })}
    </div>
    {total > 1 && <>
      <button type="button" className="carrossel__seta carrossel__seta--anterior" aria-label="Foto anterior"
        onClick={() => irPara(indice - 1)} disabled={indice === 0}><ChevronLeft /></button>
      <button type="button" className="carrossel__seta carrossel__seta--proxima" aria-label="Próxima foto"
        onClick={() => irPara(indice + 1)} disabled={indice === total - 1}><ChevronRight /></button>
      <div className="carrossel__pontos">
        {imagens.map((_, i) => <button type="button" key={i} className="carrossel__ponto" aria-label={`Ir para a foto ${i + 1}`}
          aria-current={i === indice ? 'true' : undefined} onClick={() => irPara(i)} />)}
      </div>
      <p className="sr-only" aria-live="polite">Foto {indice + 1} de {total}</p>
    </>}
  </div>;
}
