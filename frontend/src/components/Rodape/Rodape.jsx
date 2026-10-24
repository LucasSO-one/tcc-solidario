import { Link } from 'react-router-dom';
import './Rodape.scss';

export default function Rodape() {
  return (
    <footer className="rodape">
      <span>VittaFlow · Prevenção do desperdício de alimentos</span>
      <nav aria-label="Documentos legais" className="rodape__links">
        <Link to="/termos">Termos de uso</Link>
        <Link to="/privacidade">Política de privacidade</Link>
      </nav>
    </footer>
  );
}
