import { iniciais } from '../../utils/formatar';
import { urlImagem } from '../../utils/imagens';

// Foto da conta ou, sem foto, as iniciais do nome.
export default function Avatar({ conta, usuario, tamanho = 36, className = '' }) {
  const foto = urlImagem(conta?.fotoUrl);
  return (
    <span className={`avatar ${className}`.trim()} style={{ width: tamanho, height: tamanho }} aria-hidden="true">
      {foto ? <img src={foto} alt="" /> : iniciais(conta?.nomeExibicao ?? usuario?.email)}
    </span>
  );
}
