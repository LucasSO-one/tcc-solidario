import { useEffect, useRef, useState } from 'react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

const SAIDA = 512; // px da imagem final (quadrada)

/**
 * Recorte quadrado da foto: arraste para posicionar, use o zoom para aproximar.
 * Setas do teclado também movem a imagem. Entrega um JPEG 512×512.
 */
export default function RecorteFoto({ arquivo, onConfirmar, onCancelar, enviando }) {
  const visorRef = useRef(null);
  const imgRef = useRef(null);
  const arraste = useRef(null);
  const [url, setUrl] = useState(null);
  const [visor, setVisor] = useState(280);
  const [natural, setNatural] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  // FileReader em vez de URL.createObjectURL: não há URL para revogar (seguro no StrictMode)
  useEffect(() => {
    const leitor = new FileReader();
    leitor.onload = () => setUrl(leitor.result);
    leitor.readAsDataURL(arquivo);
    return () => leitor.abort();
  }, [arquivo]);

  const escalaBase = natural ? Math.max(visor / natural.w, visor / natural.h) : 1;
  const escala = escalaBase * zoom;

  function limitar(x, y, s = escala) {
    const largura = natural.w * s, altura = natural.h * s;
    return { x: Math.min(0, Math.max(visor - largura, x)), y: Math.min(0, Math.max(visor - altura, y)) };
  }

  function aoCarregar(e) {
    const v = visorRef.current.clientWidth; // o visor é responsivo: mede o tamanho real
    const n = { w: e.target.naturalWidth, h: e.target.naturalHeight };
    const s = Math.max(v / n.w, v / n.h);
    setVisor(v);
    setNatural(n);
    setPos({ x: (v - n.w * s) / 2, y: (v - n.h * s) / 2 });
  }

  function mudarZoom(novo) {
    // Mantém o ponto central do visor fixo ao aproximar
    const novaEscala = escalaBase * novo;
    const cx = (visor / 2 - pos.x) / escala, cy = (visor / 2 - pos.y) / escala;
    setZoom(novo);
    setPos(limitar(visor / 2 - cx * novaEscala, visor / 2 - cy * novaEscala, novaEscala));
  }

  function aoPressionar(e) {
    e.currentTarget.setPointerCapture(e.pointerId);
    arraste.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  }
  function aoMover(e) {
    if (!arraste.current || !natural) return;
    setPos(limitar(e.clientX - arraste.current.x, e.clientY - arraste.current.y));
  }
  function aoTeclar(e) {
    const passo = e.shiftKey ? 40 : 10;
    const delta = { ArrowLeft: [passo, 0], ArrowRight: [-passo, 0], ArrowUp: [0, passo], ArrowDown: [0, -passo] }[e.key];
    if (!delta || !natural) return;
    e.preventDefault();
    setPos(p => limitar(p.x + delta[0], p.y + delta[1]));
  }

  function confirmar() {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = SAIDA;
    const lado = visor / escala;
    canvas.getContext('2d').drawImage(imgRef.current, -pos.x / escala, -pos.y / escala, lado, lado, 0, 0, SAIDA, SAIDA);
    canvas.toBlob(blob => onConfirmar(new File([blob], 'foto.jpg', { type: 'image/jpeg' })), 'image/jpeg', 0.9);
  }

  return (
    <Modal title="Ajustar foto" onClose={enviando ? undefined : onCancelar} footer={<>
      <Button variant="ghost" onClick={onCancelar} disabled={enviando}>Cancelar</Button>
      <Button variant="primary" onClick={confirmar} loading={enviando} disabled={!natural}>Usar esta foto</Button>
    </>}>
      <div className="recorte-foto">
        <p>Arraste para posicionar e use o zoom para enquadrar. A foto é exibida em formato quadrado.</p>
        <div ref={visorRef} className="recorte-foto__visor" tabIndex={0} data-autofocus
          aria-label="Área de recorte. Use as setas do teclado para mover a imagem."
          onPointerDown={aoPressionar} onPointerMove={aoMover} onPointerUp={() => { arraste.current = null; }}
          onKeyDown={aoTeclar}>
          {url && <img ref={imgRef} src={url} alt="" onLoad={aoCarregar} draggable="false"
            style={natural ? { width: natural.w * escala, height: natural.h * escala, transform: `translate(${pos.x}px, ${pos.y}px)` } : { opacity: 0 }} />}
        </div>
        <label className="recorte-foto__zoom">
          <span>Zoom</span>
          <input type="range" min="1" max="3" step="0.01" value={zoom} onChange={e => mudarZoom(Number(e.target.value))} />
        </label>
      </div>
    </Modal>
  );
}
