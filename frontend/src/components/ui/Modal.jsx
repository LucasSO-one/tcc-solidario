import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import useFocusTrap from '../../hooks/useFocusTrap';

// Modal acessível: foco preso dentro, Esc fecha, foco devolvido ao fechar.
// No celular vira bottom sheet (ver _overlays.scss).
export default function Modal({ title, onClose, children, footer, size }) {
  const dialogRef = useRef(null);
  const titleId = useId();
  useFocusTrap(dialogRef, true, onClose);

  useEffect(() => {
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = overflow; };
  }, []);

  return createPortal(
    <div className="modal" onMouseDown={e => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div ref={dialogRef} className={`modal__dialog${size ? ` modal__dialog--${size}` : ''}`}
        role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
        <div className="modal__header">
          <h2 className="modal__title" id={titleId}>{title}</h2>
          <button type="button" className="icon-btn" aria-label="Fechar" onClick={onClose}><X /></button>
        </div>
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
