import { Link } from 'react-router-dom';
import Logo from '../../components/Logo/Logo';
import Rodape from '../../components/Rodape/Rodape';
import './Publicas.scss';

// Layout das páginas institucionais públicas (termos, privacidade).
export default function PaginaDocumento({ titulo, atualizadoEm, children }) {
  return (
    <div className="documento">
      <header className="documento__topo">
        <Link to="/login" aria-label="VittaFlow: voltar ao início"><Logo /></Link>
        <Link to="/login" className="btn btn--secondary btn--sm">Entrar</Link>
      </header>
      <main className="documento__conteudo">
        <span className="eyebrow">Documentos</span>
        <h1>{titulo}</h1>
        <p className="documento__data">Última atualização: {atualizadoEm}</p>
        {children}
      </main>
      <div className="documento__rodape"><Rodape /></div>
    </div>
  );
}
