import { useEffect, useState } from 'react';
import { listarVitrine, listarOfertas, listarDoacoes } from '../../service/produtoService';
import { reservarProduto } from '../../service/reserva';
import { mensagemErro } from '../../utils/mensagemErro';
import CodigoRetiradaModal from '../CodigoRetiradaModal/CodigoRetiradaModal';
import './Fluxos.scss';

const preco = valor => Number(valor).toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
const data = valor => new Date(valor).toLocaleString('pt-BR');

export default function VitrineAlimentos({ modo = 'vitrine' }) {
  const ong = modo === 'ong';
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState('');
  const [frutas, setFrutas] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [reservando, setReservando] = useState(null);
  const [reserva, setReserva] = useState(null);
  const [revisao, setRevisao] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let ativo = true;
    async function carregar() {
      try {
        const listar = ong ? listarDoacoes : modo === 'ofertas' ? listarOfertas : listarVitrine;
        const itens = await listar({ busca, apenasFrutasFeias:frutas, signal:controller.signal });
        if (ativo) { setProdutos(frutas ? itens.filter(p => p.frutaFeia) : itens); setErro(''); }
      } catch (e) {
        if (ativo && e.name !== 'CanceledError' && e.name !== 'AbortError') setErro(mensagemErro(e));
      } finally { if (ativo) setCarregando(false); }
    }
    const debounce = setTimeout(carregar, 250);
    const polling = setInterval(carregar, 30000);
    return () => { ativo = false; controller.abort(); clearTimeout(debounce); clearInterval(polling); };
  }, [busca, frutas, modo, ong, revisao]);

  async function reservar(produto) {
    if (reservando) return;
    setReservando(produto.id); setErro('');
    try {
      const criada = await reservarProduto(produto.id);
      setReserva(criada);
      setProdutos(atuais => atuais.filter(p => p.id !== produto.id));
    } catch (e) { setErro(mensagemErro(e)); }
    finally { setReservando(null); setRevisao(v => v + 1); }
  }

  return <main className="fluxo">
    <header><h1>{ong ? 'Vitrine para ONGs' : modo === 'ofertas' ? 'Melhores ofertas' : 'Vitrine de alimentos'}</h1>
      <p>{ong ? 'Prioridade para a validade mais próxima. Os alimentos em prévia permitem planejar a retirada.' : 'Reserve e retire no estabelecimento. O pagamento é realizado no local.'}</p>
    </header>
    <div className="fluxo-filtros">
      <input aria-label="Buscar alimento ou estabelecimento" placeholder="Buscar alimento ou estabelecimento" value={busca} onChange={e => setBusca(e.target.value)} />
      <label><input type="checkbox" checked={frutas} onChange={e => setFrutas(e.target.checked)} /> Somente frutas feias</label>
    </div>
    {erro && <p role="alert" className="fluxo-erro">{erro}</p>}
    {carregando && <p>Carregando alimentos...</p>}
    {!carregando && !produtos.length && <p>Nenhum alimento disponível para estes filtros.</p>}
    <div className="fluxo-grade">{produtos.map(p => <article key={p.id} className={
      'fluxo-card' + (ong && !p.previaDoacao && p.horasRestantes <= 24 ? ' fluxo-card--urgente' : '') + (p.previaDoacao ? ' fluxo-card--previa' : '')}>
      {p.imagemUrl && <img src={new URL(p.imagemUrl, new URL(import.meta.env.VITE_API_URL || '/api', window.location.origin)).href} alt={p.nome} />}
      <h2>{p.nome}</h2><p>{p.nomeVarejista}</p>
      {p.frutaFeia && <span className="fluxo-status">Fora do padrão estético</span>}
      <p>Validade: {data(p.dataValidade)}</p>
      {p.previaDoacao ? <p className="fluxo-aviso">Prévia para planejamento. Reserva prevista a partir de {data(p.disponivelParaReservaEm)}.</p>
        : <strong>{ong ? 'Doação gratuita' : preco(p.precoDesconto ?? p.precoOriginal)}</strong>}
      <button className="btn btn--primary" disabled={!p.podeReservar || reservando !== null}
        onClick={() => reservar(p)}>{p.previaDoacao ? 'Aguardando liberação' : reservando === p.id ? 'Reservando...' : 'Reservar'}</button>
    </article>)}</div>
    {reserva && <CodigoRetiradaModal reserva={reserva} onFechar={() => setReserva(null)} />}
  </main>;
}
