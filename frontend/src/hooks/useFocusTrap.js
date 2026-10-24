import { useEffect, useRef } from 'react';

const FOCAVEIS = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Enquanto `ativo`, prende o foco do teclado dentro de `ref` e chama `onEscape` ao apertar Esc.
 * Ao desativar, devolve o foco ao elemento que estava focado antes (ex.: o botão que abriu).
 * O foco inicial vai para [data-autofocus], ou para o primeiro elemento focável.
 */
export default function useFocusTrap(ref, ativo, onEscape) {
  const onEscapeRef = useRef(onEscape);
  useEffect(() => { onEscapeRef.current = onEscape; }, [onEscape]);

  useEffect(() => {
    const container = ref.current;
    if (!ativo || !container) return;
    const anterior = document.activeElement;
    (container.querySelector('[data-autofocus]') ?? container.querySelector(FOCAVEIS) ?? container).focus();

    function aoTeclar(e) {
      if (e.key === 'Escape') { e.stopPropagation(); onEscapeRef.current?.(); return; }
      if (e.key !== 'Tab') return;
      const itens = [...container.querySelectorAll(FOCAVEIS)].filter(el => el.offsetParent !== null);
      if (!itens.length) { e.preventDefault(); return; }
      const [primeiro, ultimo] = [itens[0], itens[itens.length - 1]];
      if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
    }
    document.addEventListener('keydown', aoTeclar);
    return () => {
      document.removeEventListener('keydown', aoTeclar);
      if (anterior?.isConnected) anterior.focus();
    };
  }, [ref, ativo]);
}
