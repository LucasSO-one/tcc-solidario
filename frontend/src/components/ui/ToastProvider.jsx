import { useCallback, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { ToastContext } from './toastContext';

const ICONES = { success: CheckCircle2, error: XCircle, warning: AlertTriangle, info: Info };
const DURACAO = 5000;

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const proximoId = useRef(0);

  const fechar = useCallback(id => setToasts(atuais => atuais.filter(t => t.id !== id)), []);
  const mostrar = useCallback((variant, mensagem) => {
    const id = ++proximoId.current;
    setToasts(atuais => [...atuais.slice(-2), { id, variant, mensagem }]);
    setTimeout(() => fechar(id), DURACAO);
  }, [fechar]);

  const api = useMemo(() => ({
    success: m => mostrar('success', m),
    error: m => mostrar('error', m),
    warning: m => mostrar('warning', m),
    info: m => mostrar('info', m),
  }), [mostrar]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-region" aria-live="polite" aria-atomic="false">
        {toasts.map(({ id, variant, mensagem }) => {
          const Icone = ICONES[variant];
          return (
            <div key={id} className={`toast toast--${variant}`} role={variant === 'error' ? 'alert' : 'status'}>
              <Icone className="toast__icon" aria-hidden="true" />
              <p className="toast__message">{mensagem}</p>
              <button type="button" className="toast__close" aria-label="Fechar aviso" onClick={() => fechar(id)}><X /></button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
