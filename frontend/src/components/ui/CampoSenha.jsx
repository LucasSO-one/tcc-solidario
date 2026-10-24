import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// Input de senha com botão de mostrar/ocultar. Repassa id/aria-* do <Field> para o input.
export default function CampoSenha(props) {
  const [visivel, setVisivel] = useState(false);
  return (
    <div className="campo-senha">
      <input {...props} type={visivel ? 'text' : 'password'} />
      <button type="button" className="icon-btn campo-senha__botao" onClick={() => setVisivel(v => !v)}
        aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={visivel}>
        {visivel ? <EyeOff /> : <Eye />}
      </button>
    </div>
  );
}
