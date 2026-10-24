import { cloneElement, isValidElement, useId } from 'react';
import { AlertCircle } from 'lucide-react';

// Envolve um input/select/textarea com label acima e ajuda/erro abaixo,
// ligando tudo por id/aria para leitores de tela.
// `prefixo` exibe um texto fixo dentro do campo (ex.: "R$").
export default function Field({ label, help, error, required = false, full = false, prefixo, className = '', children }) {
  const id = useId();
  const helpId = help ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const controle = isValidElement(children)
    ? cloneElement(children, {
      id: children.props.id ?? id,
      required: children.props.required ?? required,
      'aria-invalid': error ? true : undefined,
      'aria-describedby': [errorId, helpId].filter(Boolean).join(' ') || undefined,
    })
    : children;
  return (
    <div className={['field', full && 'field--full', className].filter(Boolean).join(' ')}>
      {label && (
        <label className="field__label" htmlFor={isValidElement(children) ? children.props.id ?? id : undefined}>
          {label}{required && <span className="field__required" aria-hidden="true">*</span>}
        </label>
      )}
      {prefixo
        ? <div className="input-prefix"><span className="input-prefix__symbol" aria-hidden="true">{prefixo}</span>{controle}</div>
        : controle}
      {error
        ? <p className="field__error" id={errorId} role="alert"><AlertCircle aria-hidden="true" />{error}</p>
        : help && <p className="field__help" id={helpId}>{help}</p>}
    </div>
  );
}
