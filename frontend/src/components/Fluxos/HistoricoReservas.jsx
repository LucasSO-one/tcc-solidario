import { useEffect, useState } from 'react';
import { listarMinhasReservas } from '../../service/reserva';
import { mensagemErro } from '../../utils/mensagemErro';
import CodigoRetiradaModal from '../CodigoRetiradaModal/CodigoRetiradaModal';
import './Fluxos.scss';

const data = valor => new Date(valor).toLocaleString('pt-BR');
export default function HistoricoReservas({ titulo = 'Minhas reservas' }) {
  const [reservas, setReservas] = useState([]);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [selecionada, setSelecionada] = useState(null);
  useEffect(() => {
    let ativo = true;
    async function carregar() {
      try { const itens = await listarMinhasReservas(); if (ativo) { setReservas(itens); setErro(''); } }
      catch (e) { if (ativo) setErro(mensagemErro(e)); }
      finally { if (ativo) setCarregando(false); }
    }
    carregar(); const timer = setInterval(carregar, 30000);
    return () => { ativo = false; clearInterval(timer); };
  }, []);
  const reserva = reservas.find(r => r.id === selecionada && r.status === 'Ativa');
  return <main className="fluxo"><header><h1>{titulo}</h1>
    <p>Apresente o seu código no estabelecimento. A reserva dura até duas horas e é encerrada antes se o alimento vencer.</p></header>
    {erro && <p role="alert" className="fluxo-erro">{erro}</p>}
    {carregando && <p>Carregando reservas...</p>}
    {['Ativa', 'Concluida', 'Expirada'].map(status => <section key={status}>
      <h2>{({ Ativa:'Reservas ativas', Concluida:'Retiradas concluídas', Expirada:'Reservas expiradas' })[status]}</h2>
      <div className="fluxo-lista">{reservas.filter(r => r.status === status).map(r => <article className="fluxo-card" key={r.id}>
        <h3>{r.produtoNome}</h3><p>{r.nomeVarejista} · {r.tipo === 'Doacao' ? 'Doação' : 'Compra'}</p>
        <small>Reservado em {data(r.dataReserva)}</small>
        {status === 'Ativa' && <><p>Retire até {data(new Date(Math.min(new Date(r.dataExpiracao), new Date(r.dataValidade))))}</p>
          <button className="btn btn--primary" onClick={() => setSelecionada(r.id)}>Ver código</button></>}
        {r.dataRetirada && <p>Retirada confirmada em {data(r.dataRetirada)}</p>}
        {status === 'Expirada' && <p>Prazo encerrado. Este código não pode mais ser utilizado.</p>}
      </article>)}</div>
      {!carregando && !reservas.some(r => r.status === status) && <p>Nenhuma reserva nesta situação.</p>}
    </section>)}
    {reserva && <CodigoRetiradaModal reserva={reserva} onFechar={() => setSelecionada(null)} />}
  </main>;
}
