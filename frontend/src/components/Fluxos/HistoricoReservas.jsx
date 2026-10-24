import { useEffect, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { listarMinhasReservas, cancelarReserva } from '../../service/reserva';
import { dataHora } from '../../utils/formatar';
import { mensagemErro } from '../../utils/mensagemErro';
import CodigoRetiradaModal from '../CodigoRetiradaModal/CodigoRetiradaModal';
import Alert from '../ui/Alert';
import { StatusBadge } from '../ui/Badge';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import Modal from '../ui/Modal';
import Skeleton from '../ui/Skeleton';
import { useToast } from '../ui/toastContext';
import './Fluxos.scss';

const SECOES = { Ativa:'Aguardando retirada', Concluida:'Retiradas concluídas', Expirada:'Reservas expiradas', Cancelada:'Reservas canceladas' };
const VAZIO = {
  Ativa: 'Nenhuma reserva aguardando retirada. Explore a vitrine para encontrar alimentos disponíveis.',
  Concluida: 'Quando uma retirada for confirmada pelo estabelecimento, ela aparece aqui.',
  Expirada: 'Nenhuma reserva expirou. Ótimo!',
  Cancelada: 'Nenhuma reserva cancelada.',
};

export default function HistoricoReservas({ titulo = 'Minhas reservas', descricao, status: statusVisiveis = Object.keys(SECOES) }) {
  const toast = useToast();
  const [reservas, setReservas] = useState([]);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [selecionada, setSelecionada] = useState(null);
  const [confirmarCancelamento, setConfirmarCancelamento] = useState(null);
  const [cancelando, setCancelando] = useState(false);
  const [revisao, setRevisao] = useState(0);
  useEffect(() => {
    let ativo = true;
    async function carregar() {
      try { const itens = await listarMinhasReservas(); if (ativo) { setReservas(itens); setErro(''); } }
      catch (e) { if (ativo) setErro(mensagemErro(e)); }
      finally { if (ativo) setCarregando(false); }
    }
    carregar(); const timer = setInterval(carregar, 30000);
    return () => { ativo = false; clearInterval(timer); };
  }, [revisao]);
  async function cancelar() {
    setCancelando(true);
    try { await cancelarReserva(confirmarCancelamento.id); toast.success('Reserva cancelada. O alimento voltou a ficar disponível.'); }
    catch (e) { toast.error(mensagemErro(e)); }
    finally { setCancelando(false); setConfirmarCancelamento(null); setRevisao(v => v + 1); }
  }
  const reserva = reservas.find(r => r.id === selecionada && r.status === 'Ativa');
  return <div className="fluxo"><header><span className="eyebrow">Acompanhamento</span><h1>{titulo}</h1>
    <p>{descricao ?? 'Apresente o código no estabelecimento. Cada reserva vale por até duas horas e é encerrada antes se o alimento vencer.'}</p></header>
    {erro && <Alert variant="error">{erro}</Alert>}
    {statusVisiveis.map(status => <section key={status}>
      <h2>{SECOES[status]}</h2>
      {carregando ? <div className="fluxo-lista" aria-busy="true"><div className="card"><Skeleton variant="title" /><Skeleton width="60%" /></div></div>
        : !reservas.some(r => r.status === status) ? <EmptyState icon={ClipboardList} title="Nada por aqui">{VAZIO[status]}</EmptyState>
        : <div className="fluxo-lista">{reservas.filter(r => r.status === status).map(r => <article className="fluxo-card" key={r.id}>
          <StatusBadge tipo="reserva" status={r.status} />
          <h3>{r.produtoNome}</h3><p>{r.nomeVarejista} · {r.tipo === 'Doacao' ? 'Doação' : 'Compra'}</p>
          <small>Reservado em {dataHora(r.dataReserva)}</small>
          {status === 'Ativa' && <p>Retire até <strong>{dataHora(new Date(Math.min(new Date(r.dataExpiracao), new Date(r.dataValidade))))}</strong></p>}
          {r.dataRetirada && <p>Retirada confirmada em {dataHora(r.dataRetirada)}</p>}
          {status === 'Ativa' && <div className="fluxo-card__acoes">
            <Button variant="secondary" onClick={() => setSelecionada(r.id)}>Ver código</Button>
            <Button variant="ghost" onClick={() => setConfirmarCancelamento(r)}>Cancelar reserva</Button>
          </div>}
        </article>)}</div>}
    </section>)}
    {reserva && <CodigoRetiradaModal reserva={reserva} onFechar={() => setSelecionada(null)} />}
    {confirmarCancelamento && <Modal title="Cancelar reserva?" onClose={() => !cancelando && setConfirmarCancelamento(null)}
      footer={<>
        <Button variant="ghost" onClick={() => setConfirmarCancelamento(null)} disabled={cancelando} data-autofocus>Manter reserva</Button>
        <Button variant="danger" onClick={cancelar} loading={cancelando}>Cancelar reserva</Button>
      </>}>
      <p><strong>{confirmarCancelamento.produtoNome}</strong> volta a ficar disponível para outras pessoas e o código atual deixa de valer.</p>
    </Modal>}
  </div>;
}
