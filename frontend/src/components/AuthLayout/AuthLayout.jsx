import { Link } from 'react-router-dom';
import Logo from '../Logo/Logo';
import Rodape from '../Rodape/Rodape';
import './AuthLayout.scss';

// Layout das telas públicas de acesso: painel de marca à esquerda (desktop) e formulário à direita.
export default function AuthLayout({ ilustracao, titulo, frase, children }) {
  return (
    <div className="auth">
      <aside className="auth__marca" style={{ backgroundImage: `url(${ilustracao})` }}>
        <Link to="/login" className="auth__logo"><Logo className="logo--claro" /></Link>
        <div className="auth__texto">
          <h1 className="auth__titulo">{titulo}</h1>
          <span className="auth__divisor" aria-hidden="true" />
          <p className="auth__frase">{frase}</p>
        </div>
      </aside>
      <main className="auth__conteudo">
        <Link to="/login" className="auth__logo-mobile"><Logo /></Link>
        <div className="auth__cartao">{children}</div>
        <Rodape />
      </main>
    </div>
  );
}
