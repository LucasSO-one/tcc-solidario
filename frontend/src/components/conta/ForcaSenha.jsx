import { Check, X } from 'lucide-react';
import { REQUISITOS_SENHA } from '../../utils/mascaras';

const NIVEIS = ['Muito fraca', 'Fraca', 'Razoável', 'Boa', 'Forte'];

// Indicador de força + lista dos requisitos da política de senha.
export default function ForcaSenha({ senha }) {
  const atendidos = REQUISITOS_SENHA.filter(([, teste]) => teste(senha)).length;
  const nivel = senha ? Math.min(4, atendidos + (senha.length >= 12 && atendidos === 4 ? 1 : 0)) : 0;
  return (
    <div className="forca-senha" aria-live="polite">
      <div className="forca-senha__barra" data-nivel={nivel} role="meter" aria-valuemin={0} aria-valuemax={4}
        aria-valuenow={nivel} aria-label={`Força da senha: ${senha ? NIVEIS[nivel] : 'não informada'}`}>
        {[1, 2, 3, 4].map(i => <span key={i} className={i <= nivel ? 'forca-senha__passo--ativo' : ''} />)}
      </div>
      {senha && <p className="forca-senha__nivel">Força: <strong>{NIVEIS[nivel]}</strong></p>}
      <ul className="forca-senha__requisitos">
        {REQUISITOS_SENHA.map(([texto, teste]) => {
          const ok = teste(senha);
          return <li key={texto} className={ok ? 'forca-senha__ok' : ''}>
            {ok ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}
            <span>{texto}<span className="sr-only">{ok ? ': atendido' : ': pendente'}</span></span>
          </li>;
        })}
      </ul>
    </div>
  );
}
