import './Logo.scss';

// Logo provisório da VittaFlow. Para trocar pela marca definitiva, altere apenas este componente.
// variant="full": símbolo + wordmark | variant="symbol": só o símbolo (menu recolhido, favicon)
export default function Logo({ variant = 'full', className = '' }) {
  return (
    <span className={`logo logo--${variant} ${className}`.trim()} role="img" aria-label="VittaFlow">
      <span className="logo__simbolo" aria-hidden="true">
        {/* Folha desenhada por uma única linha contínua de fluxo: haste → nervura → contorno */}
        <svg viewBox="0 0 32 32" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 27 L8 24 C13 19 18 13 25.5 6.5 C26 14 22.5 21 15.5 23.6 C12.2 24.8 9.8 24.6 8 24 C7.8 17.5 11.5 11 18.5 8.3 C21.2 7.3 23.6 6.8 25.5 6.5" />
        </svg>
      </span>
      {variant === 'full' && (
        <span className="logo__texto" aria-hidden="true">
          <span className="logo__vitta">Vitta</span><span className="logo__flow">Flow</span>
        </span>
      )}
    </span>
  );
}
