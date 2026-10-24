import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';

const ICONES = { error: XCircle, success: CheckCircle2, warning: AlertTriangle, info: Info };

// Mensagem inline. Erros são anunciados imediatamente; os demais, de forma educada.
export default function Alert({ variant = 'info', children, className = '' }) {
  const Icone = ICONES[variant];
  return (
    <div className={`alert alert--${variant} ${className}`.trim()} role={variant === 'error' ? 'alert' : 'status'}>
      <Icone aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
