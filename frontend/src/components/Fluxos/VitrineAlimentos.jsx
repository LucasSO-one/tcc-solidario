import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ShoppingBasket } from 'lucide-react';
import { listarVitrine, listarOfertas, listarDoacoes } from '../../service/produtoService';
import { reservarProduto } from '../../service/reserva';
import { dataHora, moeda } from '../../utils/formatar';
import { fotosDoProduto } from '../../utils/imagens';
import { mensagemErro } from '../../utils/mensagemErro';
import CodigoRetiradaModal from '../CodigoRetiradaModal/CodigoRetiradaModal';
import ProdutoCard from '../produto/ProdutoCard';
import Alert from '../ui/Alert';
import Badge, { StatusBadge } from '../ui/Badge';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import { SkeletonCard } from '../ui/Skeleton';
import './Fluxos.scss';

const FILTROS_VALIDADE = [['', 'Qualquer validade'], ['24', 'Vence em até 24h'], ['72', 'Vence em até 3 dias'], ['168', 'Vence em até 7 dias']];

export default function VitrineAlimentos({ modo = 'vitrine' }) {
  const ong = modo === 'ong';
  const ofertas = modo === 'ofertas';
  const [searchParams, setSearchParams] = useSearchParams();
  const produtoSelecionado = modo === 'vitrine' ? searchParams.get('produto') : null;
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState('');
  const [frutas, setFrutas] = useState(false);
  const [categoria, setCategoria] = useState('');
  const [validade, setValidade] = useState('');
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

  const categorias = useMemo(() => [...new Set(produtos.map(p => p.categoria).filter(Boolean))].sort(), [produtos]);
  const visiveis = produtos.filter(p => (!produtoSelecionado || p.id === produtoSelecionado) && (!categoria || p.categoria === categoria) && (!validade || p.horasRestantes <= Number(validade)));

  async function reservar(produto) {
    if (ofertas || reservando) return;
    setReservando(produto.id); setErro('');
    try {
      const criada = await reservarProduto(produto.id);
      setReserva(criada);
      setProdutos(atuais => atuais.filter(p => p.id !== produto.id));
    } catch (e) { setErro(mensagemErro(e)); }
    finally { setReservando(null); setRevisao(v => v + 1); }
  }

  return <div className="fluxo">
    <header>
      <span className="eyebrow">{ong ? 'Doações' : ofertas ? 'Ofertas' : 'Vitrine'}</span>
      <h1>{ong ? 'Alimentos disponíveis para doação' : ofertas ? 'Ofertas em destaque' : 'Vitrine de alimentos'}</h1>
      <p>{ong ? 'Os alimentos com validade mais próxima aparecem primeiro. Itens em prévia ajudam a planejar a próxima retirada.' : ofertas ? 'Conheça os alimentos destacados pelos varejistas. Abra o alimento na vitrine para consultar e fazer sua reserva.' : 'Explore todos os alimentos disponíveis para venda, com ou sem desconto. Faça sua reserva e pague diretamente no estabelecimento.'}</p>
    </header>
    {produtoSelecionado && <div className="fluxo-acoes">
      <p>Você está consultando o alimento selecionado em Ofertas.</p>
      <Button variant="ghost" onClick={() => setSearchParams(atuais => {
        const proximos = new URLSearchParams(atuais);
        proximos.delete('produto');
        return proximos;
      })}>Ver catálogo completo</Button>
    </div>}
    <div className="fluxo-filtros">
      <div className="search-input">
        <Search className="search-input__icon" aria-hidden="true" />
        <input type="search" aria-label="Buscar alimento ou estabelecimento" placeholder="Buscar alimento ou estabelecimento" value={busca} onChange={e => setBusca(e.target.value)} />
      </div>
      <div className="field"><select aria-label="Filtrar por categoria" value={categoria} onChange={e => setCategoria(e.target.value)}>
        <option value="">Todas as categorias</option>
        {categorias.map(c => <option key={c} value={c}>{c}</option>)}
      </select></div>
      <div className="field"><select aria-label="Filtrar por validade" value={validade} onChange={e => setValidade(e.target.value)}>
        {FILTROS_VALIDADE.map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}
      </select></div>
      <label className="checkbox"><input type="checkbox" checked={frutas} onChange={e => setFrutas(e.target.checked)} /> Somente fora do padrão</label>
    </div>
    {erro && <Alert variant="error">{erro}</Alert>}
    {carregando ? <div className="grade-produtos" aria-busy="true">{[0, 1, 2, 3].map(i => <SkeletonCard key={i} />)}</div>
      : !visiveis.length ? <EmptyState icon={ShoppingBasket} title={produtoSelecionado ? 'Este alimento não está disponível nesta consulta' : ofertas ? 'Nenhuma oferta em destaque' : 'Nenhum alimento por aqui agora'}
        action={ofertas ? <Link className="btn btn--secondary" to="/dashboard/consumidor/marketplace">Explorar a vitrine</Link> : undefined}>
        {produtoSelecionado ? 'Confira os filtros ou abra o catálogo completo. O lote pode ter sido reservado, destinado à doação ou vencido.'
          : produtos.length ? 'Nenhum alimento combina com esses filtros. Tente ampliar a busca.'
          : ofertas ? 'Os destaques aparecem aqui quando publicados. Na vitrine você encontra todos os alimentos disponíveis para venda.'
          : ong ? 'Assim que um varejista liberar alimentos para doação, eles aparecem nesta vitrine.'
          : 'Volte mais tarde: novos alimentos chegam todos os dias.'}
      </EmptyState>
      : <div className="grade-produtos">{visiveis.map(p => <ProdutoCard key={p.id}
        className={(ong && !p.previaDoacao && p.horasRestantes <= 24 ? 'produto-card--urgente' : '') + (p.previaDoacao ? ' produto-card--previa' : '')}
        nome={p.nome} imagens={fotosDoProduto(p)} categoria={p.categoria} quantidade={p.quantidade}
        dataValidade={p.dataValidade} local={p.nomeVarejista}
        badges={<>{ong && !p.previaDoacao && <StatusBadge status={p.status} />}
          {!ong && p.isOferta && <Badge variant="info">Destaque do varejista</Badge>}
          {p.frutaFeia && <Badge variant="neutral">Fora do padrão</Badge>}</>}
        destaque={p.previaDoacao
          ? <Alert variant="warning">Prévia para planejamento. Reserva liberada a partir de {dataHora(p.disponivelParaReservaEm)}.</Alert>
          : ong ? <span className="preco"><span className="preco__atual">Doação gratuita</span></span>
          : <span className="preco"><span className="preco__atual">{moeda(p.precoDesconto ?? p.precoOriginal)}</span>
            {p.precoDesconto != null && p.precoDesconto < p.precoOriginal && <span className="preco__original">{moeda(p.precoOriginal)}</span>}
            {p.descontoPercentual > 0 && <Badge variant="success">-{p.descontoPercentual}%</Badge>}</span>}>
        {ofertas ? <Link className="btn btn--secondary btn--block"
          aria-label={`Ver ${p.nome} na vitrine`}
          to={`/dashboard/consumidor/marketplace?produto=${encodeURIComponent(p.id)}`}>Ver na vitrine</Link>
          : <Button variant="secondary" block disabled={!p.podeReservar || (reservando !== null && reservando !== p.id)}
          loading={reservando === p.id} onClick={() => reservar(p)}>
          {p.previaDoacao ? 'Aguardando liberação' : ong ? 'Solicitar doação' : 'Reservar alimento'}
        </Button>}
      </ProdutoCard>)}</div>}
    {reserva && <CodigoRetiradaModal reserva={reserva} onFechar={() => setReserva(null)} />}
  </div>;
}
