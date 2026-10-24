import { useState } from 'react';
import { AlarmClock, CalendarCheck, OctagonAlert, Store } from 'lucide-react';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';
import CarrosselImagens from './CarrosselImagens';
import useAgora from '../../hooks/useAgora';
import { dataCurta } from '../../utils/formatar';
import './ProdutoCard.scss';

// Validade em destaque: cor + ícone + texto.
export function ValidadeBadge({ dataValidade, vencido = false }) {
  const agora = useAgora();
  const horas = (new Date(dataValidade) - agora) / 36e5;
  if (vencido || horas <= 0) return <Badge variant="danger" icon={OctagonAlert}>Vencido</Badge>;
  if (horas < 1) return <Badge variant="warning" icon={AlarmClock}>Vence em menos de 1h</Badge>;
  if (horas <= 36) return <Badge variant="warning" icon={AlarmClock}>Vence em {Math.floor(horas)}h</Badge>;
  const dias = Math.ceil(horas / 24);
  return <Badge variant="success" icon={CalendarCheck}>Vence em {dias} dias · {dataCurta(dataValidade)}</Badge>;
}

/**
 * Card de alimento: carrossel → nome → categoria e quantidade → validade → local → ação.
 * Clicar na foto abre o visualizador em tela cheia.
 */
// mostrarValidade=false para itens já encerrados (vendido, doado, vencido): a situação já diz tudo.
export default function ProdutoCard({ nome, imagens, categoria, quantidade, dataValidade, vencido, mostrarValidade = true, local, badges, destaque, children, className = '' }) {
  const [ampliada, setAmpliada] = useState(null);
  return <article className={`produto-card ${className}`.trim()}>
    <CarrosselImagens imagens={imagens} alt={nome} categoria={categoria} onAbrir={setAmpliada} />
    <div className="produto-card__corpo">
      <h3 className="produto-card__nome">{nome}</h3>
      <p className="produto-card__meta">{[categoria, quantidade != null && `${quantidade} ${quantidade === 1 ? 'unidade' : 'unidades'}`].filter(Boolean).join(' · ')}</p>
      <div className="produto-card__badges">{mostrarValidade && <ValidadeBadge dataValidade={dataValidade} vencido={vencido} />}{badges}</div>
      {local && <p className="produto-card__local"><Store aria-hidden="true" />{local}</p>}
      {destaque && <div className="produto-card__destaque">{destaque}</div>}
      {children && <div className="produto-card__acoes">{children}</div>}
    </div>
    {ampliada !== null && <Modal title={nome} size="lightbox" onClose={() => setAmpliada(null)}>
      <CarrosselImagens imagens={imagens} alt={nome} categoria={categoria} variante="lightbox" indiceInicial={ampliada} autoFocus />
    </Modal>}
  </article>;
}
